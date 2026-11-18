// Stateless Model Context Protocol endpoint (Streamable HTTP, JSON responses).
//
// Tools are read-only and unauthenticated, and read their data from
// dist/mcp/catalog.json, which Astro renders from src/data/projects.ts and
// src/data/catalog.ts at build time. Advertised by
// /.well-known/mcp/server-card.json and /.well-known/api-catalog.

const PROTOCOL_VERSION = '2025-06-18';
const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER_INFO = {
  name: 'emiliano-go-portfolio',
  title: 'Emiliano G.O. — portfolio',
  version: '1.0.0',
};
const INSTRUCTIONS =
  'Read-only portfolio server. Start with list_projects, then get_project for detail. '
  + 'All data is public and unauthenticated; source pages are at https://emiliano-go.com.';

const TOOLS = [
  {
    name: 'list_projects',
    title: 'List projects',
    description:
      'List every featured case study and secondary package, with category, summary, stack and links.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_project',
    title: 'Get one project',
    description:
      'Return one project by id or display name, case-insensitive (for example "trustsight" or "DBWarden").',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Project id or name, e.g. "trustsight".' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'search_projects',
    title: 'Search projects',
    description:
      'Search projects by free-text query across name, summary, stack and category.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Free-text query, e.g. "rust xml".' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_profile',
    title: 'Get profile',
    description:
      "Return Emiliano G.O.'s name, role, location, spoken languages and profile links.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const BASE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Mcp-Protocol-Version',
  Vary: 'Accept',
  'Cache-Control': 'no-store',
};

let catalogPromise;

function loadCatalog(context) {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const url = new URL('/mcp/catalog.json', new URL(context.request.url).origin);
      const fetchAsset = context.env?.ASSETS
        ? context.env.ASSETS.fetch(url.toString())
        : fetch(url);
      const response = await fetchAsset;
      if (!response.ok) throw new Error(`catalog unavailable (${response.status})`);
      return response.json();
    })().catch((error) => {
      catalogPromise = undefined;
      throw error;
    });
  }
  return catalogPromise;
}

function textResult(value) {
  return {
    content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    structuredContent: value,
    isError: false,
  };
}

function errorResult(message) {
  return {
    content: [{ type: 'text', text: message }],
    isError: true,
  };
}

function projectSummary(project) {
  return {
    id: project.id,
    name: project.name,
    category: project.category,
    summary: project.summary,
    stack: project.stack,
    tier: project.tier,
    url: project.url ?? null,
    links: project.links,
  };
}

function score(project, terms) {
  const haystacks = [
    project.id.toLowerCase(),
    project.name.toLowerCase(),
    project.category.toLowerCase(),
    project.summary.toLowerCase(),
    project.stack.join(' ').toLowerCase(),
  ];
  let total = 0;
  for (const term of terms) {
    const matched = haystacks.some((value) => value.includes(term));
    if (!matched) return 0;
    total += 1;
  }
  return total;
}

async function callTool(name, args, context) {
  const catalog = await loadCatalog(context);

  if (name === 'list_projects') {
    return textResult({
      site: catalog.site,
      count: catalog.projects.length,
      projects: catalog.projects.map(projectSummary),
    });
  }

  if (name === 'get_project') {
    const wanted = String(args?.id ?? '').trim().toLowerCase();
    if (!wanted) return errorResult('Missing required argument "id".');
    const project = catalog.projects.find(
      (item) => item.id.toLowerCase() === wanted || item.name.toLowerCase() === wanted,
    );
    if (!project) {
      const near = catalog.projects
        .filter((item) => item.id.toLowerCase().includes(wanted) || item.name.toLowerCase().includes(wanted))
        .map((item) => item.id)
        .slice(0, 5);
      return errorResult(
        `No project with id "${args?.id}".${near.length ? ` Close matches: ${near.join(', ')}.` : ''}`,
      );
    }
    return textResult(projectSummary(project));
  }

  if (name === 'search_projects') {
    const query = String(args?.query ?? '').trim().toLowerCase();
    if (!query) return errorResult('Missing required argument "query".');
    const limit = Math.min(Math.max(Number(args?.limit) || 5, 1), 20);
    const terms = query.split(/\s+/).filter(Boolean);
    const matches = catalog.projects
      .map((project) => ({ project, points: score(project, terms) }))
      .filter((entry) => entry.points > 0)
      .sort((a, b) => b.points - a.points || a.project.name.localeCompare(b.project.name))
      .slice(0, limit)
      .map((entry) => projectSummary(entry.project));
    return textResult({ query, count: matches.length, projects: matches });
  }

  if (name === 'get_profile') {
    return textResult(catalog.profile);
  }

  return null;
}

function rpcError(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

async function handleMessage(message, context) {
  if (!message || typeof message !== 'object' || message.jsonrpc !== '2.0') {
    return rpcError(message?.id, -32600, 'Invalid Request');
  }

  const { id, method, params } = message;
  const isNotification = id === undefined || id === null;

  switch (method) {
    case 'initialize': {
      const requested = params?.protocolVersion;
      const protocolVersion = SUPPORTED_PROTOCOLS.includes(requested) ? requested : PROTOCOL_VERSION;
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion,
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      };
    }

    case 'notifications/initialized':
    case 'notifications/cancelled':
    case 'notifications/roots/list_changed':
      return null;

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} };

    case 'tools/list':
      return { jsonrpc: '2.0', id, result: { tools: TOOLS } };

    case 'tools/call': {
      const name = params?.name;
      if (!TOOLS.some((tool) => tool.name === name)) {
        return rpcError(id, -32602, `Unknown tool: ${name}`);
      }
      try {
        const result = await callTool(name, params?.arguments ?? {}, context);
        if (!result) return rpcError(id, -32603, `Tool "${name}" is not implemented.`);
        return { jsonrpc: '2.0', id, result };
      } catch (error) {
        return rpcError(id, -32603, `Tool "${name}" failed: ${error.message}`);
      }
    }

    case 'prompts/list':
      return { jsonrpc: '2.0', id, result: { prompts: [] } };

    case 'resources/list':
      return { jsonrpc: '2.0', id, result: { resources: [] } };

    case 'resources/templates/list':
      return { jsonrpc: '2.0', id, result: { resourceTemplates: [] } };

    default:
      if (isNotification) return null;
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

export async function onRequestPost(context) {
  let payload;
  try {
    payload = await context.request.json();
  } catch {
    return new Response(JSON.stringify(rpcError(null, -32700, 'Parse error')), {
      status: 400,
      headers: BASE_HEADERS,
    });
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return new Response(JSON.stringify(rpcError(null, -32600, 'Invalid Request')), {
        status: 400,
        headers: BASE_HEADERS,
      });
    }
    const responses = (await Promise.all(payload.map((message) => handleMessage(message, context))))
      .filter(Boolean);
    if (responses.length === 0) return new Response(null, { status: 202, headers: BASE_HEADERS });
    return new Response(JSON.stringify(responses), { status: 200, headers: BASE_HEADERS });
  }

  const response = await handleMessage(payload, context);
  if (response === null) return new Response(null, { status: 202, headers: BASE_HEADERS });
  const failed = response.error && response.error.code === -32700;
  return new Response(JSON.stringify(response), {
    status: failed ? 400 : 200,
    headers: BASE_HEADERS,
  });
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify(
      rpcError(null, -32000, 'This MCP endpoint is stateless and POST-only; it does not open an SSE stream.'),
    ),
    { status: 405, headers: { ...BASE_HEADERS, Allow: 'POST, OPTIONS' } },
  );
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: BASE_HEADERS });
}
