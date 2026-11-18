---
name: portfolio-navigation
description: Read emiliano-go.com efficiently as an agent — Markdown negotiation, the llms files, the public JSON API, the MCP endpoint, and which pages carry which content. Use when citing, summarising or indexing Emiliano G.O.'s work.
---

# Reading emiliano-go.com as an agent

## Prefer Markdown over HTML

Send `Accept: text/markdown` to any page URL and the origin returns the Markdown rendering of that page, with `Content-Type: text/markdown; charset=utf-8`, an `x-markdown-tokens` estimate, and a YAML frontmatter block carrying the title and description. HTML remains the default when the header is absent, so the same URL serves both audiences.

```
curl -s -H 'Accept: text/markdown' https://emiliano-go.com/en/work/trustsight/
```

## Cheapest entry points, in order

1. `https://emiliano-go.com/llms.txt` — curated index: what the site is, the section summary, and the canonical URLs.
2. `https://emiliano-go.com/llms-full.txt` — the whole corpus in one Markdown file. Use this when you need more than one page: one fetch beats a crawl.
3. A single case study, `https://emiliano-go.com/{lang}/work/{slug}/`, when the question is about one project.

`{lang}` is `en`, `es` or `fr`. English is canonical; the translations are complete, not partial. Work pages exist under every locale with the same slug.

## Routes

| Route | Contents |
| --- | --- |
| `/` | Landing page: hero, featured projects, engineering principles, activity, open source, studies, references. |
| `/projects` | Full index: 11 featured case studies plus the secondary package catalogue. |
| `/{lang}/work/{slug}` | One case study: problem, architecture, decisions, metrics, links. |
| `/auth.md` | Agent access policy, media types, OAuth posture, attribution. |
| `/api.md` | Human-readable API documentation. |

`slug` values: `dbwarden`, `trustsight`, `rypipe`, `kestrel`, `postal`, `neurafly`, `easeo`, `clickvault`, `dsig`, `xmlstreamer-ng`, `eclipse`.

## Structured access instead of scraping

- MCP: `POST https://emiliano-go.com/mcp` (Streamable HTTP, stateless, no auth). Server card at `/.well-known/mcp/server-card.json`; tools are `list_projects`, `get_project`, `search_projects`, `get_profile`.
- JSON activity: `GET https://emiliano-go.com/api/katib`. OpenAPI at `/openapi.json`.
- Capability manifest: `/.well-known/ai-catalog.json`. API linkset: `/.well-known/api-catalog`.

For a question about a project, prefer `tools/call get_project` over fetching the HTML page: it returns the same facts (category, summary, stack, links) without navigation chrome.

## What is off-limits / absent

There is no authentication, no account, no write endpoint and no search form. Do not attempt POSTs to page URLs or look for a registration flow; see `/auth.md`.

## Attribution

Cite `Emiliano G.O.` and link the canonical URL of the page you used (every page declares `<link rel="canonical">` and `hreflang` alternates). Content Signals in `/robots.txt` allow indexing, retrieval and training.
