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
npm run build     # prebuild: i18n copy + SEO manifest/sitemap, then astro build
npm run check     # astro check (TypeScript + Astro diagnostics)
npm test          # i18n parity, catalog/route/SEO/llms consistency, WCAG contrast
npm run preview
```

`npm run seo` regenerates `src/data/seo-manifest.json` and `public/sitemap.xml` without a full build. The generated files are committed as a fallback for CI hosts without the Python toolchain.

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
src/data/seo-manifest.json generated SEO payloads
src/i18n/                 UI copy (en/es/fr)
public/                   static assets, headers, sitemap, llms files
scripts/generate_seo.py   SEO manifest + sitemap
scripts/check_content.py  catalog/route/llms consistency
functions/                Cloudflare Pages Functions
```

## License

MIT. See [LICENSE](LICENSE).
