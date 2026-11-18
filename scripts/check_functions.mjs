// Exercises the Pages Functions the way the edge does: /mcp JSON-RPC and the
// Markdown-negotiation middleware, with the ASSETS binding stubbed from dist/.
// Run by `npm test` after `npm run build`.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url);

async function load(relative) {
  try {
    return JSON.parse(await readFile(new URL(relative, ROOT), 'utf8'));
  } catch {
    return null;
  }
}

const catalog = await load('dist/mcp/catalog.json');
if (!catalog) {
  console.log('skip: dist/mcp/catalog.json missing; run npm run build first');
  process.exit(0);
}

const { onRequestPost, onRequestGet } = await import(new URL('../functions/mcp.js', import.meta.url));
const { onRequest: middleware } = await import(new URL('../functions/_middleware.js', import.meta.url));

const MARKDOWN = '# TrustSight\n\nEvidence-driven security analysis for AUR packages.\n';

const assets = {
  async fetch(input) {
    const url = input instanceof URL
      ? input
      : new URL(typeof input === 'string' ? input : input.url);
    if (url.pathname === '/mcp/catalog.json') {
      return new Response(JSON.stringify(catalog), { headers: { 'Content-Type': 'application/json' } });
    }
    if (url.pathname.startsWith('/.well-known/')) {
      return new Response('{"ok":true}', { headers: { 'Content-Type': 'application/octet-stream' } });
    }
    if (url.pathname.endsWith('.md')) {
      return new Response(MARKDOWN, { headers: { 'Content-Type': 'text/markdown' } });
    }
    return new Response('not found', { status: 404 });
  },
};

function context(request) {
  return {
    request,
    env: { ASSETS: assets },
    next: async () => new Response('<html>page</html>', { headers: { 'Content-Type': 'text/html' } }),
  };
}

function rpcRequest(body) {
  return new Request('https://emiliano-go.com/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
}

async function rpc(body) {
  const response = await onRequestPost(context(rpcRequest(body)));
  return { status: response.status, body: await response.json() };
}

// initialize
{
  const { status, body } = await rpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'check', version: '1' } },
  });
  assert.equal(status, 200);
  assert.equal(body.jsonrpc, '2.0');
  assert.equal(body.id, 1);
  assert.equal(body.result.protocolVersion, '2025-06-18');
  assert.equal(body.result.serverInfo.name, 'emiliano-go-portfolio');
  assert.equal(body.result.capabilities.tools.listChanged, false);
  assert.ok(body.result.instructions.length > 0);
}

// an unsupported protocol version falls back to ours instead of failing
{
  const { body } = await rpc({
    jsonrpc: '2.0',
    id: 2,
    method: 'initialize',
    params: { protocolVersion: '1999-01-01' },
  });
  assert.equal(body.result.protocolVersion, '2025-06-18');
}

// notifications are accepted without a body
{
  const response = await onRequestPost(context(rpcRequest({ jsonrpc: '2.0', method: 'notifications/initialized' })));
  assert.equal(response.status, 202);
}

// tools/list
{
  const { body } = await rpc({ jsonrpc: '2.0', id: 3, method: 'tools/list' });
  const names = body.result.tools.map((tool) => tool.name).sort();
  assert.deepEqual(names, ['get_profile', 'get_project', 'list_projects', 'search_projects']);
  for (const tool of body.result.tools) {
    assert.equal(tool.inputSchema.type, 'object', `${tool.name} needs an object inputSchema`);
    assert.ok(tool.description.length > 10, `${tool.name} needs a description`);
  }
}

// tools/call: every project is listed
{
  const { body } = await rpc({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'list_projects', arguments: {} } });
  assert.equal(body.result.isError, false);
  assert.equal(body.result.structuredContent.count, catalog.projects.length);
  const featured = body.result.structuredContent.projects.filter((project) => project.tier === 'featured');
  assert.ok(featured.every((project) => project.url.startsWith('https://emiliano-go.com/en/work/')));
}

// tools/call: lookup is case-insensitive and returns the case-study URL
{
  const { body } = await rpc({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: { name: 'get_project', arguments: { id: 'TrustSight' } },
  });
  assert.equal(body.result.structuredContent.id, 'trustsight');
  assert.equal(body.result.structuredContent.url, 'https://emiliano-go.com/en/work/trustsight/');
}

// tools/call: an unknown project is an error result, not a crash
{
  const { body } = await rpc({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: { name: 'get_project', arguments: { id: 'does-not-exist' } },
  });
  assert.equal(body.result.isError, true);
}

// tools/call: search returns ranked matches
{
  const { body } = await rpc({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name: 'search_projects', arguments: { query: 'rust' } },
  });
  assert.ok(body.result.structuredContent.count >= 1);
  assert.ok(body.result.structuredContent.projects.every((project) => project.stack.length > 0));
}

// unknown method and unknown tool are protocol errors
{
  const method = await rpc({ jsonrpc: '2.0', id: 8, method: 'nope' });
  assert.equal(method.body.error.code, -32601);
  const tool = await rpc({ jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'nope' } });
  assert.equal(tool.body.error.code, -32602);
}

// batched requests answer in order; GET is refused because the server is stateless
{
  const response = await onRequestPost(
    context(rpcRequest([
      { jsonrpc: '2.0', id: 10, method: 'ping' },
      { jsonrpc: '2.0', id: 11, method: 'tools/list' },
    ])),
  );
  const body = await response.json();
  assert.equal(body.length, 2);
  assert.deepEqual(body.map((entry) => entry.id), [10, 11]);

  const get = await onRequestGet();
  assert.equal(get.status, 405);
  assert.match(get.headers.get('Allow'), /POST/);
}

// www is a duplicate host: it must redirect to the canonical apex, at any path
{
  const response = await middleware(context(
    new Request('https://www.emiliano-go.com/en/work/trustsight/?ref=x', { headers: { Accept: 'text/html' } }),
  ));
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), 'https://emiliano-go.com/en/work/trustsight/?ref=x');

  const post = await middleware(context(new Request('https://www.emiliano-go.com/x', { method: 'POST', body: 'a' })));
  assert.equal(post.status, 308, 'non-GET keeps its method via 308');

  const apex = await middleware(context(new Request('https://emiliano-go.com/en/', { headers: { Accept: 'text/html' } })));
  assert.equal(apex.status, 200, 'the apex is not redirected');
}

// The language entry pages redirect on Accept-Language, but never over an explicit choice
{
  const spanish = await middleware(context(
    new Request('https://emiliano-go.com/', { headers: { Accept: 'text/html', 'Accept-Language': 'es-UY,es;q=0.9' } }),
  ));
  assert.equal(spanish.status, 302);
  assert.equal(spanish.headers.get('Location'), 'https://emiliano-go.com/es/');
  assert.match(spanish.headers.get('Vary'), /Accept-Language/);

  const frenchProjects = await middleware(context(
    new Request('https://emiliano-go.com/projects/', { headers: { Accept: 'text/html', 'Accept-Language': 'fr-FR' } }),
  ));
  assert.equal(frenchProjects.headers.get('Location'), 'https://emiliano-go.com/fr/projects/');

  const chosen = await middleware(context(
    new Request('https://emiliano-go.com/', { headers: { Accept: 'text/html', 'Accept-Language': 'es', Cookie: 'lang=en' } }),
  ));
  assert.equal(chosen.status, 200, 'a stored choice beats Accept-Language');

  const crawler = await middleware(context(new Request('https://emiliano-go.com/', { headers: { Accept: 'text/html' } })));
  assert.equal(crawler.status, 200, 'no Accept-Language keeps serving the stub');

  const deep = await middleware(context(
    new Request('https://emiliano-go.com/en/about/', { headers: { Accept: 'text/html', 'Accept-Language': 'es' } }),
  ));
  assert.equal(deep.status, 200, 'only entry pages redirect');
}

// Markdown negotiation
{
  const request = new Request('https://emiliano-go.com/en/work/trustsight/', {
    headers: { Accept: 'text/markdown, text/html;q=0.5' },
  });
  const response = await middleware(context(request));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /^text\/markdown/);
  assert.match(response.headers.get('Vary'), /Accept/);
  assert.ok(Number(response.headers.get('x-markdown-tokens')) > 0);
  assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(await response.text(), MARKDOWN);
}

// HTML stays the default
{
  const request = new Request('https://emiliano-go.com/en/work/trustsight/', {
    headers: { Accept: 'text/html,application/xhtml+xml' },
  });
  const response = await middleware(context(request));
  assert.match(response.headers.get('Content-Type'), /^text\/html/);
}

// The extensionless well-known paths get an explicit media type from the middleware
for (const [path, expected] of [
  ['/.well-known/api-catalog', /^application\/linkset\+json/],
  ['/.well-known/oauth-protected-resource', /^application\/json/],
]) {
  const response = await middleware(context(new Request(`https://emiliano-go.com${path}`, { headers: { Accept: '*/*' } })));
  assert.match(response.headers.get('Content-Type'), expected, `${path} media type`);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
}

// JSON endpoints and static files keep their own representation
for (const path of ['/api/katib', '/.well-known/ai-catalog.json', '/openapi.json', '/robots.txt']) {
  const response = await middleware(context(
    new Request(`https://emiliano-go.com${path}`, { headers: { Accept: 'text/markdown' } }),
  ));
  assert.doesNotMatch(response.headers.get('Content-Type'), /text\/markdown/, `${path} must not be converted`);
}

// a page without a twin degrades to HTML instead of 500
{
  const broken = { ...context(new Request('https://emiliano-go.com/x/', { headers: { Accept: 'text/markdown' } })) };
  broken.env = { ASSETS: { fetch: async () => new Response('missing', { status: 404 }) } };
  const response = await middleware(broken);
  assert.match(response.headers.get('Content-Type'), /^text\/html/);
}

console.log(`ok: /mcp JSON-RPC, ${catalog.projects.length} catalog entries, 4 tools and Markdown negotiation behave as documented`);
