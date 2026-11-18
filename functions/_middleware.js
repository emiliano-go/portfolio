// Markdown content negotiation for the static site.
//
// `scripts/generate_markdown.py` writes an `index.md` twin next to every built
// `index.html`. When a client asks for `text/markdown`, this middleware serves the
// twin from the ASSETS binding; otherwise the request continues untouched, so HTML
// stays the default for browsers. The `.md` paths are excluded from Functions in
// `_routes.json`, which also keeps the ASSETS lookup from re-entering this middleware.

const MARKDOWN_TYPE = 'text/markdown; charset=utf-8';

// Function responses bypass public/_headers, so the security-relevant headers are
// repeated here. Keep them in sync with the `/*` rule in that file.
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Access-Control-Allow-Origin': '*',
};

// These well-known paths carry no file extension, so the asset server cannot infer
// their media type (RFC 9727 fixes the linkset path; RFC 9728 fixes the protected
// resource path). public/_headers also sets them; this keeps the guarantee even
// where a static-asset Content-Type override is ignored.
const TYPED_DOCUMENTS = {
  '/.well-known/api-catalog': 'application/linkset+json; charset=utf-8',
  '/.well-known/oauth-protected-resource': 'application/json; charset=utf-8',
};

// The language entry pages exist because the site is served from path prefixes. A
// visitor's stored choice (cookie) wins over their Accept-Language; without either we
// keep serving the stub, whose client redirect picks English — which is also what a
// crawler without those headers must keep seeing.
const ENTRY_PATHS = new Set(['/', '/projects', '/projects/', '/about', '/about/']);
const LOCALE_RE = /^(en|es|fr)\b/i;

function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=').trim();
  }
  return null;
}

function preferredLocale(request) {
  const stored = readCookie(request.headers.get('Cookie'), 'lang');
  if (stored && LOCALE_RE.test(stored)) return stored.slice(0, 2).toLowerCase();

  const acceptLanguage = request.headers.get('Accept-Language') || '';
  for (const candidate of acceptLanguage.split(',')) {
    const tag = candidate.split(';')[0].trim();
    const match = LOCALE_RE.exec(tag);
    if (match) return match[1].toLowerCase();
  }
  return 'en';
}

function markdownPath(pathname) {
  if (pathname.endsWith('/')) return `${pathname}index.md`;
  return `${pathname}/index.md`;
}

async function serveTypedDocument(context, url, contentType) {
  const { request, env } = context;
  try {
    const asset = await env.ASSETS.fetch(new Request(url.toString()));
    if (!asset.ok) return null;
    const body = await asset.text();
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': contentType,
        Vary: 'Accept',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // One canonical host. Cloudflare Pages answers on both the apex and www, so the
  // duplicate is redirected here (308 keeps the method for non-idempotent requests)
  // rather than being left to compete with the canonical URL.
  if (url.hostname === 'www.emiliano-go.com') {
    const target = new URL(`${url.pathname}${url.search}`, 'https://emiliano-go.com');
    const safe = request.method === 'GET' || request.method === 'HEAD';
    return new Response(null, {
      status: safe ? 301 : 308,
      headers: {
        ...SECURITY_HEADERS,
        Location: target.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  if (ENTRY_PATHS.has(url.pathname)) {
    const locale = preferredLocale(request);
    if (locale !== 'en') {
      const suffix = url.pathname === '/' ? '/' : `/${url.pathname.split('/').filter(Boolean).join('/')}/`;
      return new Response(null, {
        status: 302,
        headers: {
          ...SECURITY_HEADERS,
          Location: new URL(`/${locale}${suffix}`, 'https://emiliano-go.com').toString(),
          Vary: 'Accept-Language, Cookie',
          'Cache-Control': 'private, no-store',
        },
      });
    }
  }

  const typed = TYPED_DOCUMENTS[url.pathname];
  if (typed && env && env.ASSETS) {
    const document = await serveTypedDocument(context, url, typed);
    if (document) return document;
  }

  const accept = request.headers.get('Accept') || '';
  if (!/\btext\/markdown\b/i.test(accept)) return next();

  const { pathname, origin } = url;
  if (!env || !env.ASSETS) return next();
  // JSON endpoints, the MCP endpoint and static files keep their own representation.
  if (pathname.startsWith('/api/') || pathname.startsWith('/.well-known/')) return next();
  if (pathname === '/mcp' || pathname.startsWith('/mcp/')) return next();
  if (/\.[a-z0-9]{1,6}$/i.test(pathname)) return next();

  try {
    const target = new URL(markdownPath(pathname), origin).toString();
    const asset = await env.ASSETS.fetch(new Request(target, { headers: { Accept: 'text/markdown' } }));
    if (!asset.ok) return next();

    const body = await asset.text();
    return new Response(request.method === 'HEAD' ? null : body, {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': MARKDOWN_TYPE,
        'Content-Length': String(new TextEncoder().encode(body).byteLength),
        'x-markdown-tokens': String(Math.max(1, Math.ceil(body.length / 4))),
        Vary: 'Accept',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch {
    // Never break the page because a twin is missing or unreadable.
    return next();
  }
}
