import type { APIRoute } from 'astro';
import { projects } from '../../data/projects';
import { secondary } from '../../data/catalog';

// Static endpoint: Astro writes dist/mcp/catalog.json at build time. functions/mcp.js
// fetches it through the ASSETS binding, so the MCP tools and the rendered pages are
// fed by exactly the same data (src/data/projects.ts + src/data/catalog.ts).
const SITE = 'https://emiliano-go.com';

const featured = projects.map((project) => ({
  id: project.id,
  name: project.name,
  category: project.category,
  summary: project.summary,
  stack: project.stack,
  links: project.links.map((link) => ({ label: link.label, href: link.href })),
  url: `${SITE}/en/work/${project.id}/`,
  tier: 'featured',
}));

const packages = secondary.map((entry) => ({
  id: entry.id,
  name: entry.name,
  category: 'Package',
  summary: entry.desc.en,
  stack: entry.stack,
  links: entry.links.map((link) => ({ label: link.label, href: link.href })),
  tier: 'package',
}));

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        site: SITE,
        generatedFrom: 'src/data/projects.ts, src/data/catalog.ts',
        profile: {
          name: 'Emiliano G.O.',
          role: 'Systems & Infrastructure Engineer',
          location: 'Montevideo, Uruguay',
          languages: ['Spanish (native)', 'English (fluent)', 'French (working)'],
          links: [
            { label: 'Portfolio', href: `${SITE}/` },
            { label: 'GitHub', href: 'https://github.com/emiliano-go' },
            { label: 'LinkedIn', href: 'https://www.linkedin.com/in/emiliano-go' },
            { label: 'Blog', href: 'https://blog.emiliano-go.com/' },
          ],
        },
        projects: [...featured, ...packages],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
  );
