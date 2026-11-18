# portafolio

Personal portfolio for **Emiliano G.O.** — selected projects, engineering principles, activity, studies and references.

Built with [Astro](https://astro.build) 7, [Tailwind CSS 4](https://tailwindcss.com), and TypeScript. Requires Node.js 22.23.4 or newer. No client framework and no runtime server for the page itself.

## Stack

- Astro static output, `en` / `es` / `fr`
- Tailwind CSS 4 via `@tailwindcss/vite`
- Self-hosted fonts (`@fontsource/*`)
- `easeo` (Python) for the SEO manifest and sitemap
- Cloudflare Pages Functions for live activity (`functions/api/katib.js`)

## Development

```bash
npm ci
npm run dev
```

`npm run dev` copies `src/i18n/*.json` to `public/i18n/` first. The site runs at `http://localhost:4321`.

## Build and checks

```bash
npm run build     # prebuild: i18n copy + SEO manifest/sitemap → astro build → postbuild: Markdown twins
npm run check     # astro check (TypeScript + Astro diagnostics)
npm test          # content/SEO/llms parity, WCAG contrast, agent-discovery docs, /mcp + Markdown negotiation
npm run preview
```

`npm run seo` regenerates `src/data/seo-manifest.json` and `public/sitemap.xml` without a full build. The generated files are committed as a fallback for CI hosts without the Python toolchain.

## Agent discovery

The site is published for machine readers as well as browsers. `docs/agent-discovery.md` documents every surface, the DNS-AID/DNSSEC records the zone needs, and how to verify a deploy.

- `Link` headers advertise the API catalog, OpenAPI description and capability manifest on every response (`public/_headers`).
- `/.well-known/api-catalog` (RFC 9727), `/.well-known/ai-catalog.json` (ARD), `/.well-known/mcp/server-card.json` and `/.well-known/agent-skills/index.json` are static documents in `public/`.
- `POST /mcp` is a stateless Model Context Protocol endpoint (`functions/mcp.js`) exposing four read-only tools, fed by `dist/mcp/catalog.json`, which `src/pages/mcp/catalog.json.ts` renders from `src/data/`.
- `Accept: text/markdown` returns the prebuilt Markdown twin of a page (`functions/_middleware.js`); the twins come from `scripts/generate_markdown.py` during `postbuild`.
- `www.emiliano-go.com` 301s to the apex in the same middleware, so the duplicate host that Cloudflare Pages also answers never competes with the canonical URL.
- `robots.txt` declares Content Signals and an `Agentmap`, and `/auth.md` states the access policy.
- WebMCP tools are registered in `src/layouts/Layout.astro` when the browser exposes `document.modelContext`.

`npm test` fails if a document drifts: skill digests, `urn:air:` identifiers, media types, advertised URLs, the MCP tools and the Markdown twins are all checked against this tree. The documents require no build step of their own, but the Markdown twins do — run `npm run build` before `npm test` locally.

## About page, lastmod and dates

`/{lang}/about` is the canonical "who is this" URL (bio, studies, certifications, contact) with `ProfilePage` schema and `mainEntity` pointing at the shared `Person` node. It exists in all three locales plus the `/about/` language entry stub.

`scripts/generate_seo.py` derives each route's `lastmod` (sitemap) and `dateModified` (JSON-LD) from the last commit that touched that route's sources, so a rebuild without a content change does not restamp the whole sitemap. When git history is unavailable (the Docker build, which ignores `.git`), it falls back to the committed `src/data/content-dates.json`; refresh that file with `python3 scripts/generate_seo.py --write-dates` after content edits. `ProjectPage.astro` renders the same date as a visible "Last updated" line, so the page, the sitemap and the structured data cannot disagree.

## Project catalog

- Landing page: **TrustSight, rypipe, DBWarden, xmlstreamer-ng, eclipse** (in that order).
- `/projects` lists every public project.
- Case studies live at `/{lang}/work/{slug}` for the projects in `src/data/projects.ts`.
- Adding a case study requires: an entry in `src/data/projects.ts`, a page in `src/pages/[lang]/work/`, and a slug in `WORK_PAGES` in `scripts/generate_seo.py`. `npm test` verifies the three stay in sync.
- All TrustSight-related repositories are grouped under the TrustSight case study. Same for the DBWarden ecosystem.
- Personal repositories, notes, dotfiles and archived predecessors are intentionally excluded.

## Environment

Cloudflare Pages → Settings → Environment variables:

| Variable | Purpose |
|---|---|
| `KATIB_GITHUB_TOKEN` | Optional GitHub PAT used by `functions/api/katib.js` to avoid rate limits. |

Local copies go in `.env` (ignored) or the shell environment. Do not commit tokens.

## Deployment

**Production: Cloudflare Pages.** Build command `npm run build`, output directory `dist`. Set `NODE_VERSION=22.23.4` in the Pages environment (or rely on `.nvmrc`). Pages Functions in `functions/` are deployed with the site automatically. `public/_headers` sets security and cache headers.

`npm run build` requires Python 3 and the packages in `requirements-seo.txt`; if `easeo` is unavailable, the prebuild script falls back to the committed SEO artifacts.

**Optional: Docker.** The image serves the static build through nginx. It does not run Cloudflare Functions, so `/api/katib` is the build-time snapshot and activity may be stale. The `Deploy container` workflow publishes `ghcr.io/emiliano-go/portfolio` on pushes to `master`.

## Repository layout

```
src/pages/[lang]/         localized pages
src/pages/[lang]/work/    project case studies
src/data/projects.ts      case-study content
src/pages/mcp/catalog.json.ts  JSON catalog consumed by /mcp and WebMCP
src/data/seo-manifest.json generated SEO payloads
src/i18n/                 UI copy (en/es/fr)
public/                   static assets, headers, sitemap, llms files
public/.well-known/       API catalog, ARD manifest, MCP card, agent skills, security.txt
functions/                Cloudflare Pages Functions (/api/katib, /api/health, /mcp, Markdown negotiation)
scripts/generate_seo.py   SEO manifest + sitemap
scripts/generate_markdown.py  post-build Markdown twins for Accept: text/markdown
scripts/check_content.py  catalog/route/llms consistency
scripts/check_discovery.py  agent-discovery document consistency
docs/agent-discovery.md   what is published, and the DNS records the zone needs
```

## License

MIT. See [LICENSE](LICENSE).
