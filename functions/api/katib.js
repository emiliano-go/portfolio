const KATIB_BASE = 'https://katib.jsn.cam';
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

export async function onRequestGet(context) {
  const { env } = context;
  const token = env.KATIB_GITHUB_TOKEN;

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
