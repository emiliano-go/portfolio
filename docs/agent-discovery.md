# Agent discovery

Everything in this file is either shipped in the repository (so it deploys with the
site) or a one-time change in the Cloudflare dashboard or DNS zone that only the
account owner can make. The machine-readable documents live in `public/`:

| Surface | Path in the repo | Served at |
| --- | --- | --- |
| Link relations (RFC 8288, RFC 9727 §3) | `public/_headers` | every response |
| API catalog (RFC 9727 linkset) | `public/.well-known/api-catalog` | `/.well-known/api-catalog` |
| OpenAPI 3.1 | `public/openapi.json` | `/openapi.json` |
| API documentation | `public/api.md` | `/api.md` |
| ARD capability manifest | `public/.well-known/ai-catalog.json` | `/.well-known/ai-catalog.json` |
| MCP server card (SEP-1649) | `public/.well-known/mcp/server-card.json` | `/.well-known/mcp/server-card.json` |
| MCP endpoint | `functions/mcp.js` | `POST /mcp` |
| Agent skills index | `public/.well-known/agent-skills/index.json` | `/.well-known/agent-skills/index.json` |
| Agent access policy | `public/auth.md` | `/auth.md` |
| Content Signals + Agentmap | `public/robots.txt` | `/robots.txt` |
| Markdown negotiation | `functions/_middleware.js` + `scripts/generate_markdown.py` | every HTML page |
| WebMCP tools | `src/layouts/Layout.astro` | every page, in the browser |

`npm test` runs `scripts/check_discovery.py` and `scripts/check_functions.mjs`, which
keep the declarations above truthful: digests, identifiers, media types and the
same-origin URLs a document promises are all verified against this tree.

## 1. Markdown for Agents

Requests with `Accept: text/markdown` receive the prebuilt `index.md` twin of the page
(`text/markdown; charset=utf-8`, `x-markdown-tokens`, `Vary: Accept`); HTML stays the
default. Twins are written next to each `index.html` by `npm run build`, so CI fails if
a page has no twin.

The Cloudflare **Agent Readiness → Markdown for Agents** toggle is an alternative to
this implementation. If it is enabled on the zone, Cloudflare converts the origin's
HTML itself, adds YAML frontmatter and keeps the origin's security headers. Both can
coexist: the origin already answers `text/markdown`, so Cloudflare passes it through.

## 2. Content Signals

`robots.txt` declares `Content-Signal: ai-train=yes, search=yes, ai-input=yes` for
`User-agent: *`. To change the policy for training corpora, edit that one line;
`search` and `ai-input` govern indexing and retrieval-augmented answering.

## 3. DNS-AID and DNSSEC (dashboard — owner only)

The zone is on Cloudflare (`millie.ns.cloudflare.com`, `boyd.ns.cloudflare.com`) and
the registrar is Cloudflare, so the DS record for DNSSEC is published automatically.

### DNSSEC first

Records only help if validating resolvers can authenticate them: the scanner queries
DNS-AID over DNS-over-HTTPS, and an unsigned zone is reported as unauthenticated.

1. Cloudflare dashboard → select `emiliano-go.com` → **DNS → Settings** → **DNSSEC** →
   **Enable DNSSEC**.
2. Confirm it took effect (the DS appears at the registry because the domain is
   registered with Cloudflare; no manual DS entry should be needed):

   ```sh
   dig +short DS emiliano-go.com @1.1.1.1
   dig +dnssec emiliano-go.com A @1.1.1.1 | grep RRSIG
   ```

   The first command must print a `2371 13 2 <hex>` line, the second an `RRSIG A`
   record. Cloudflare's DNSSEC panel shows a green "Active" badge when the chain is
   complete — propagation can take up to 24 h after the registry publishes the DS.

### The DNS-AID records

Cloudflare dashboard → **DNS → Records → Add record → SVCB**. Three records, all
unproxied (grey cloud), TTL Auto:

| Name | Type | Priority | Target | Params |
| --- | --- | --- | --- | --- |
| `_index._agents` | SVCB | `1` | `emiliano-go.com` | `alpn="h2,h3" port=443` |
| `_mcp._agents` | SVCB | `1` | `emiliano-go.com` | `alpn="mcp,h2" port=443` |
| `_catalog._agents` | TXT | — | `url=https://emiliano-go.com/.well-known/ai-catalog.json` | — |

- `_index._agents` is the well-known entry point: it tells an agent that the
  organisation's agent index is served by `emiliano-go.com` over HTTP/2 and HTTP/3 on
  443 (the index document is the ARD manifest at `/.well-known/ai-catalog.json`).
- `_mcp._agents` advertises the MCP protocol suite (`alpn=mcp,h2`) on the same origin,
  where `POST /mcp` lives.
- `_catalog._agents` is the ARD-spec convenience record so a resolver-only client can
  find the capability manifest without fetching anything else.

Cloudflare's SVCB editor takes the parameters in **Params** as space-separated
`key=value` pairs. If it rejects the quotes, enter `alpn=h2,h3 port=443` instead — the
wire format is identical. Optional extras from the draft (`bap`, `well-known`, `cap`)
are still experimental and use numeric `keyNNNNN` names, so leaving them out is
correct; `alpn` and `port` are the registered SVCB keys (RFC 9460) and are what
validators look for.

Verify from a machine outside the Cloudflare network:

```sh
dig +short SVCB _index._agents.emiliano-go.com @1.1.1.1
dig +short SVCB _mcp._agents.emiliano-go.com @1.1.1.1
dig +short TXT  _catalog._agents.emiliano-go.com @1.1.1.1

# What the scanner actually does (DoH):
curl -s 'https://cloudflare-dns.com/dns-query?name=_index._agents.emiliano-go.com&type=SVCB' \
  -H 'accept: application/dns-json'
```

The `SVCB` answer must be accompanied by an `RRSIG` once DNSSEC is active:

```sh
dig +dnssec SVCB _index._agents.emiliano-go.com @1.1.1.1 | grep -E 'SVCB|RRSIG'
```

### Link headers

The `Link` headers that advertise the catalog ship in `public/_headers` and are already
deployed with the site; no dashboard rule is needed. Two details in that file are
deliberate:

- All five relations live in **one** `Link` value (comma-separated, RFC 8288). Splitting
  them across repeated header lines relies on a parser merging them, and any proxy that
  keeps only the last one would drop `rel="api-catalog"`.
- `_headers` carries no comments, because the format does not document them; and
  `Content-Type` is set with the documented detach-then-set pair (`! Content-Type`)
  because Pages otherwise derives it from the file extension — which
  `/.well-known/api-catalog` does not have. `functions/_middleware.js` sets the same
  media type again so the guarantee does not depend on the static-asset header parser.

If a Cloudflare Transform Rule or "Managed Headers" setting ever strips origin `Link`
headers, re-add the same value under **Rules → Transform Rules → Modify response
header → Set** for `Link`.

## 4. What is deliberately not published

- **`/.well-known/oauth-authorization-server` and `/.well-known/oauth-protected-resource`**:
  this origin runs no OAuth 2.0 / OpenID Connect authorization server and protects no
  endpoint, so there is no truthful metadata to publish. `auth.md` states this
  explicitly. If an identity provider is ever put in front of an API here, publish the
  metadata and add the `authorization_servers` entry to the protected resource — the
  checks in `scripts/check_discovery.py` are ready for it.
- **`/.well-known/oauth-protected-resource`** for the same reason: a resource
  declaration without an authorization server would tell agents to obtain tokens that
  cannot be issued.

## 5. Verifying the deployment

After the next Cloudflare Pages deploy:

```sh
curl -sI https://emiliano-go.com/ | grep -i '^link:'
curl -sI https://emiliano-go.com/.well-known/api-catalog | grep -i content-type
curl -s -H 'Accept: text/markdown' -D - -o /dev/null https://emiliano-go.com/en/work/trustsight/ | grep -iE 'content-type|x-markdown-tokens'
curl -s https://emiliano-go.com/.well-known/agent-skills/index.json | head -c 200
curl -s https://emiliano-go.com/api/health
curl -s https://emiliano-go.com/mcp -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

WebMCP is browser-only: it needs Chrome with the WebMCP API enabled (feature-detected
at runtime — nothing runs when `document.modelContext` is absent), so it cannot be
verified with curl.
