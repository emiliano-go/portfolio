const KATIB_BASE = 'https://katib.jsn.cam';
const GITHUB_API = 'https://api.github.com';
const USERNAME = 'emiliano-go';

function mapCommits(raw) {
  return (raw.commits || []).slice(0, 3).map((c) => ({
    repo: (c.repo || '').replace('emiliano-go/', ''),
    message: c.messageHeadline || '',
    sha: c.oid || '',
    date: c.committedDate || '',
    url: c.commitUrl || '',
  }));
}

function json(body, status = 200, cache = 'public, max-age=0, s-maxage=300, stale-while-revalidate=600') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  });
}

async function latestRepoCommit(repo, token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'emiliano-go-portfolio',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=1`, { headers });
    if (!res.ok) return { repo, error: `GitHub ${res.status}` };
    const commits = await res.json();
    const commit = Array.isArray(commits) ? commits[0] : null;
    if (!commit) return { repo, error: 'No commits' };

    return {
      repo,
      sha: (commit.sha || '').slice(0, 7),
      message: (commit.commit?.message || '').split('\n')[0],
      date: commit.commit?.committer?.date || commit.commit?.author?.date || '',
      url: commit.html_url || '',
      author: commit.author?.login || commit.commit?.author?.name || '',
    };
  } catch (err) {
    return { repo, error: err.message };
  }
}

async function latestRepoCommits(repos, token) {
  return Promise.all(repos.map((repo) => latestRepoCommit(repo, token)));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const token = env.KATIB_GITHUB_TOKEN;
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || 'commits';

  if (endpoint === 'repo-commits') {
    const repos = (url.searchParams.get('repos') || '')
      .split(',')
      .map((repo) => repo.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (!repos.length) return json({ repos: [] });
    if (repos.some((repo) => !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))) {
      return json({ error: 'Invalid repository name' }, 400);
    }

    const commits = await latestRepoCommits(repos, token);
    return json({ repos: commits });
  }

  if (endpoint === 'latest-release') {
    const repo = (url.searchParams.get('repo') || '').trim();
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
      return json({ error: 'Invalid repository name' }, 400);
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'emiliano-go-portfolio',
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const res = await fetch(`${GITHUB_API}/repos/${repo}/releases/latest`, { headers });
      if (!res.ok) return json({ error: `GitHub ${res.status}` }, res.status === 404 ? 404 : 502);
      const release = await res.json();
      return json(
        {
          repo,
          tag: release.tag_name || '',
          url: release.html_url || '',
          publishedAt: release.published_at || '',
        },
        200,
        'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      );
    } catch (err) {
      return json({ error: err.message }, 502, 'no-store');
    }
  }

  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(
      `${KATIB_BASE}/v2/commits/latest?username=${encodeURIComponent(USERNAME)}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Katib ${res.status}`);

    const raw = await res.json();
    const body = JSON.stringify({
      commits: mapCommits(raw),
      languages: raw.languages || [],
    });

    return new Response(body, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, fallback: true }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
}
