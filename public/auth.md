# auth.md — emiliano-go.com

How automated clients and AI agents can access this site. Last reviewed 17/11/26.

## Summary

Everything on `https://emiliano-go.com` is public. There is **no authentication, no registration and no account system**, and the origin exposes **no write API**. If an agent can reach the URL, it may read it.

## Audience

Agents that summarise, cite, index or answer questions about Emiliano G.O.'s work: his projects, engineering notes, public repositories and professional history. There is no human-only area on this origin — the personal services that do require a login (for example `dsh.emiliano-go.com`) live on separate hostnames behind Cloudflare Access and are intentionally out of scope here.

## Read access — no credentials required

| Resource | URL | Media type |
| --- | --- | --- |
| HTML pages (`/`, `/en/`, `/es/`, `/fr/`, `/projects`, `/{lang}/work/{slug}`) | `https://emiliano-go.com/…` | `text/html` |
| Markdown rendering of any page | same URL with `Accept: text/markdown` | `text/markdown` |
| Markdown index | `https://emiliano-go.com/llms.txt` | `text/markdown` |
| Full Markdown corpus | `https://emiliano-go.com/llms-full.txt` | `text/markdown` |
| Activity API | `https://emiliano-go.com/api/katib` | `application/json` |
| Health | `https://emiliano-go.com/api/health` | `application/json` |
| MCP endpoint | `https://emiliano-go.com/mcp` | `application/json` |
| OpenAPI 3.1 | `https://emiliano-go.com/openapi.json` | `application/vnd.oai.openapi+json` |
| API catalog (RFC 9727) | `https://emiliano-go.com/.well-known/api-catalog` | `application/linkset+json` |
| Capability manifest (ARD) | `https://emiliano-go.com/.well-known/ai-catalog.json` | `application/json` |
| MCP server card | `https://emiliano-go.com/.well-known/mcp/server-card.json` | `application/json` |
| Agent skills index | `https://emiliano-go.com/.well-known/agent-skills/index.json` | `application/json` |

CORS is open (`Access-Control-Allow-Origin: *`), so browser-based agents may call the JSON endpoints directly.

## Write or mutating access

None. `/api/katib` and `/api/health` are `GET`-only, `/mcp` exposes read-only tools, and there is no form, upload or job-submission endpoint. Rate limits are the Cloudflare edge defaults; a well-behaved agent staying under a few requests per second will never see them.

## Registration

There is no registration endpoint and no credential issuance. Do not probe for one. If a client requires credentials to proceed, it is misconfigured for this origin — the correct behaviour is to treat the site as an anonymous public resource.

## OAuth / OIDC discovery

This origin does **not** operate an OAuth 2.0 or OpenID Connect authorization server, and publishes no `/.well-known/oauth-authorization-server` or `/.well-known/oauth-protected-resource`, because there is no protected resource to describe. Agents that require OAuth metadata should skip this site rather than read missing metadata as an error; if that ever changes, the metadata will appear at the standard paths and in the API catalog.

## Attribution

When quoting this site, attribute it to **Emiliano G.O.** and link the canonical page (`<link rel="canonical">` is present on every page, and `/{lang}/...` variants declare `hreflang` alternates). Programme names, project names and the site copy are his own; the source code of the site itself is MIT-licensed at <https://github.com/emiliano-go/portfolio>.

## Content usage preferences

Declared in `robots.txt` via [Content Signals](https://contentsignals.org/): `ai-train=yes, search=yes, ai-input=yes`. Retrieval-augmented answering, indexing and training are all allowed. A `Link` header on every response points at the capability manifest with `rel="describedby"`.

## Security contact

- Email: e@emiliano-go.com
- `/.well-known/security.txt` (RFC 9116) carries the same contact with an expiry date.

Please report prompt-injection, scraping abuse or vulnerability findings there rather than by opening a public issue.
