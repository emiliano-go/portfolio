import type { APIRoute } from 'astro';

const KATIB_BASE = 'https://katib.jsn.cam';
const USERNAME = 'emiliano-go';
const TOKEN = import.meta.env.KATIB_GITHUB_TOKEN || '';

interface CacheEntry<T> { data: T; expires: number; }
const cache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) return entry.data as T;
  return null;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

async function fetchKatib(path: string): Promise<any> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${KATIB_BASE}${path}${separator}username=${USERNAME}`;
  const headers: Record<string, string> = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Katib ${res.status}: ${res.statusText}`);
  return res.json();
}

export const GET: APIRoute = async ({ url }) => {
  const endpoint = url.searchParams.get('endpoint') || 'commits';
  try {
    if (endpoint === 'commits') {
      const cacheKey = 'katib-commits-v4';
      let data = getCached<any>(cacheKey, 10 * 60 * 1000);
      if (!data) {
        const raw = await fetchKatib('/v2/commits/latest');
        const commits = (raw.commits || []).slice(0, 3).map((c: any) => ({
          repo: (c.repo || '').replace('emiliano-go/', ''),
          message: c.messageHeadline || '',
          sha: c.oid || '',
          date: c.committedDate || '',
          url: c.commitUrl || '',
        }));
        data = {
          commits,
          languages: raw.languages || [],
        };
        setCache(cacheKey, data, 10 * 60 * 1000);
      }
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=600' },
      });
    }
    return new Response(JSON.stringify({ error: 'Unknown endpoint' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, fallback: true }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
