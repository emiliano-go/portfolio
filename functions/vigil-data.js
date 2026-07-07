export async function onRequest(context) {
  const { env } = context;
  const BASE = env.VIGIL_API_BASE_URL || 'https://api.emiliano-go.com/vigil';
  const KEY = env.VIGIL_API_KEY;

  const empty = () => ({
    latestCommit: null, myStats: null,
    lastWeekHourly: Array(24).fill(0),
    lastWeekDaily: [], hourLabels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    privateRepos: [], fetchedAt: new Date().toISOString(),
  });

  if (!KEY) {
    return new Response(JSON.stringify(empty()), { headers: { 'content-type': 'application/json' } });
  }

  const hdrs = { 'X-API-Key': KEY };
  async function get(p) {
    const res = await fetch(`${BASE}/api${p}`, { headers: hdrs });
    if (!res.ok) throw new Error(`API ${p}: ${res.status}`);
    return res.json();
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [repos, authors, overview, daily] = await Promise.all([
      get('/repos'), get('/stats/authors'), get('/stats/overview'), get('/stats/daily'),
    ]);

    const privateRepos = repos.filter(r => r.private).map(r => r.full_name);
    const authorTotals = {};
    for (const a of authors) authorTotals[a.author_login] = (authorTotals[a.author_login] || 0) + a.total;
    const knownBots = /\[bot\]$/;
    const sorted = Object.entries(authorTotals).filter(([l]) => !knownBots.test(l) && l !== '').sort(([,a],[,b]) => b - a);
    const myLogin = sorted[0]?.[0] || 'emiliano-go';

    let myLatestCommit = null;
    try {
      [myLatestCommit] = await get(`/commits?author_login=${encodeURIComponent(myLogin)}&limit=1`);
    } catch {}
    if (!myLatestCommit) {
      try {
        [myLatestCommit] = await get('/commits?limit=1');
      } catch {}
    }

    const myTotalCommits = overview?.total_commits ?? 0;
    const myAuthorRows = authors.filter(a => a.author_login === myLogin);
    const myRepos = new Set(myAuthorRows.map(a => a.repo));
    let myMostActiveRepo = null, myMostActiveRepoTotal = 0;
    for (const a of myAuthorRows) {
      if (a.total > myMostActiveRepoTotal) { myMostActiveRepo = a.repo; myMostActiveRepoTotal = a.total; }
    }

    let range = [];
    try {
      range = await get(`/stats/activity-range?since=${encodeURIComponent(weekAgo.toISOString())}`);
    } catch {}
    const myCommits = range.filter(c => c.author_login === myLogin);

    let streak = 0;
    try {
      const s = await get(`/stats/streak/${encodeURIComponent(myLogin)}`);
      streak = s.current_streak ?? 0;
    } catch {}

    let hourlyRows = [];
    try {
      hourlyRows = await get('/stats/hourly');
    } catch {}
    const lastWeekHourly = Array(24).fill(0);
    for (var i = 0; i < hourlyRows.length; i++) {
      lastWeekHourly[hourlyRows[i].hour] += hourlyRows[i].total;
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const lastWeekDaily = (daily?.total || [])
      .filter(function(d) { return d.period >= sevenDaysAgo; })
      .sort(function(a, b) { return a.period.localeCompare(b.period); });
    let myBusiestDay = null, myBusiestDayTotal = 0;
    for (var i = 0; i < lastWeekDaily.length; i++) {
      if (lastWeekDaily[i].total > myBusiestDayTotal) {
        myBusiestDay = lastWeekDaily[i].period;
        myBusiestDayTotal = lastWeekDaily[i].total;
      }
    }

    const repoWeekMap = {};
    const lastWeekHourly = Array.from({ length: 7 }, () => Array(24).fill(0));
    let mostActiveRepoWeek = null, mostActiveRepoWeekTotal = 0;

    for (const c of myCommits) {
      const d = new Date(c.committed_at);
      lastWeekHourly[d.getUTCDay()][d.getUTCHours()]++;
      repoWeekMap[c.repo] = (repoWeekMap[c.repo] || 0) + 1;
    }
    for (const [repo, total] of Object.entries(repoWeekMap)) {
      if (total > mostActiveRepoWeekTotal) { mostActiveRepoWeek = repo; mostActiveRepoWeekTotal = total; }
    }

    const ensureZ = s => s && !s.endsWith('Z') ? s + 'Z' : s;

    const output = {
      latestCommit: myLatestCommit ? {
        repo: myLatestCommit.repo, sha: myLatestCommit.sha,
        author_login: myLatestCommit.author_login, message: myLatestCommit.message,
        committed_at: ensureZ(myLatestCommit.committed_at), is_merge: myLatestCommit.is_merge,
      } : null,
      myStats: {
        login: myLogin, totalCommits: myTotalCommits, streak, totalRepos: myRepos.size,
        mostActiveRepo: myMostActiveRepo, mostActiveRepoTotal: myMostActiveRepoTotal,
        busiestDay: myBusiestDay, busiestDayTotal: myBusiestDayTotal,
        mostActiveRepoWeek, mostActiveRepoWeekTotal,
      },
      lastWeekHourly, lastWeekDaily,
      hourLabels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      privateRepos, fetchedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(output), {
      headers: { 'content-type': 'application/json', 'cache-control': 'no-cache' },
    });
  } catch (e) {
    return new Response(JSON.stringify(empty()), {
      headers: { 'content-type': 'application/json' },
    });
  }
}
