# emiliano-go.com API

Machine-readable surface of `https://emiliano-go.com`. Everything here is public, unauthenticated and read-only.

- OpenAPI 3.1 description: <https://emiliano-go.com/openapi.json>
- API catalog (RFC 9727 linkset): <https://emiliano-go.com/.well-known/api-catalog>
- Markdown index: <https://emiliano-go.com/llms.txt>
- Authentication and agent access: <https://emiliano-go.com/auth.md>

## `GET /api/katib`

Latest public repository activity for the `emiliano-go` GitHub account. Powered by a Cloudflare Pages Function; responses are edge-cached for five minutes.

| Query | Values | Effect |
| --- | --- | --- |
| `endpoint` | `commits` (default), `repo-commits`, `latest-release` | Which view to return. |
| `repos` | comma-separated `owner/name`, max 12 | Read only when `endpoint=repo-commits`. |
| `repo` | `owner/name` | Read only when `endpoint=latest-release`. |

```sh
curl -s https://emiliano-go.com/api/katib
curl -s 'https://emiliano-go.com/api/katib?endpoint=repo-commits&repos=emiliano-go/trustsight,emiliano-go/dbwarden'
curl -s 'https://emiliano-go.com/api/katib?endpoint=latest-release&repo=emiliano-go/trustsight'
```

Default response:

```json
{
  "commits": [
    { "repo": "trustsight", "message": "…", "sha": "abc1234", "date": "2026-11-17T…", "url": "https://github.com/…" }
  ],
  "languages": []
}
```

Errors are JSON (`{"error": "…"}`) with status 400 for a malformed `owner/name`, 404 for a repository without releases, and 502 for upstream GitHub/Katib failures. A 502 may carry `"fallback": true`, which tells the UI to keep its build-time snapshot.

## `GET /api/health`

Liveness probe. Never cached.

```json
{ "status": "ok", "site": "https://emiliano-go.com/", "time": "2026-11-17T18:04:11.000Z" }
```

## MCP

`POST https://emiliano-go.com/mcp` is a stateless [Model Context Protocol](https://modelcontextprotocol.io) endpoint using the Streamable HTTP transport (`application/json` responses, no session header, no SSE stream). Server card: <https://emiliano-go.com/.well-known/mcp/server-card.json>.

Tools:

| Tool | Input | Returns |
| --- | --- | --- |
| `list_projects` | none | Every featured case study and secondary package, with links. |
| `get_project` | `{ "id": "trustsight" }` | One project: category, summary, stack, links, case-study URL. |
| `search_projects` | `{ "query": "xml" }` | Projects whose name, summary, stack or category match. |
| `get_profile` | none | Name, role, location, languages, and profile links. |

Example:

```sh
curl -s https://emiliano-go.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Content negotiation

Send `Accept: text/markdown` to any HTML page to receive the Markdown rendering instead. HTML stays the default. Responses carry `Content-Type: text/markdown; charset=utf-8` and `x-markdown-tokens`.

```sh
curl -s -H 'Accept: text/markdown' https://emiliano-go.com/en/work/trustsight/
```

## Discovery

| Document | URL |
| --- | --- |
| API catalog | `/.well-known/api-catalog` |
| ARD capability manifest | `/.well-known/ai-catalog.json` |
| MCP server card | `/.well-known/mcp/server-card.json` |
| Agent skills index | `/.well-known/agent-skills/index.json` |
| Agent access / auth | `/auth.md` |
| Security contact | `/.well-known/security.txt` |
| Content signals | `/robots.txt` |

`Link` response headers on every page advertise the catalog, this document and the OpenAPI description (`rel="api-catalog"`, `rel="service-doc"`, `rel="service-desc"`, `rel="describedby"`, `rel="service-meta"`).
