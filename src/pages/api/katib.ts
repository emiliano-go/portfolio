import type { APIRoute } from 'astro';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv(): string {
  try {
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/^KATIB_GITHUB_TOKEN=(.+)$/m);
    return match?.[1]?.trim() || '';
  } catch { return ''; }
}

const KATIB_BASE = 'https://katib.jsn.cam';
const USERNAME = 'emiliano-go';
const TOKEN = loadEnv();

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
      const cacheKey = 'katib-commits-v3';
      let data = getCached<any>(cacheKey, 10 * 60 * 1000);
      if (!data) {
        const raw = await fetchKatib('/commits/latest');
        const commits = [];
        if (raw && raw.repo) {
          commits.push({
            repo: raw.repo.replace('emiliano-go/', ''),
            message: raw.messageHeadline,
            sha: raw.oid,
            date: raw.committedDate,
            url: raw.commitUrl,
          });
          if (raw.parentCommits) {
            for (const pc of raw.parentCommits.slice(0, 2)) {
              commits.push({
                repo: raw.repo.replace('emiliano-go/', ''),
                message: pc.messageHeadline,
                sha: pc.oid || pc.commitUrl?.split('/').pop()?.substring(0, 7) || '',
                date: pc.committedDate,
                url: pc.commitUrl,
              });
            }
          }
        }
        data = {
          commits,
          languages: raw?.languages || [],
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
