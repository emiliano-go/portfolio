export async function onRequest(context) {
  const { env } = context;
  const BASE = env.VIGIL_API_BASE_URL || 'https://api.emiliano-go.com/vigil';
  const KEY = env.VIGIL_API_KEY;

  const empty = () => ({
    latestCommit: null, myStats: null,
    lastWeekHourly: Array(24).fill(0),
    lastWeekDaily: [], hourLabels: Array(24).fill('--'),
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

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const lastWeekDaily = (daily?.total || [])
      .filter(function(d) { return d.period >= sevenDaysAgo; })
      .sort(function(a, b) { return a.period.localeCompare(b.period); });
    const repoWeekMap = {};
    let mostActiveRepoWeek = null, mostActiveRepoWeekTotal = 0;

    for (var ci = 0; ci < myCommits.length; ci++) {
      repoWeekMap[myCommits[ci].repo] = (repoWeekMap[myCommits[ci].repo] || 0) + 1;
    }
    for (const [repo, total] of Object.entries(repoWeekMap)) {
      if (total > mostActiveRepoWeekTotal) { mostActiveRepoWeek = repo; mostActiveRepoWeekTotal = total; }
    }

    // Last 24h hourly: use the zero-filled hourly range endpoint
    var now = new Date();
    var untilHour = new Date(now);
    untilHour.setUTCMinutes(0, 0, 0);
    if (now.getUTCMinutes() || now.getUTCSeconds() || now.getUTCMilliseconds()) {
      untilHour.setUTCHours(untilHour.getUTCHours() + 1);
    }
    var sinceHour = new Date(untilHour.getTime() - 24 * 60 * 60 * 1000);
    var hourlyRange = [];
    try {
      hourlyRange = await get(`/stats/hourly/authors/range?author_login=${encodeURIComponent(myLogin)}&since=${encodeURIComponent(sinceHour.toISOString())}&until=${encodeURIComponent(untilHour.toISOString())}`);
    } catch {}

    var last24hHourly = hourlyRange.map(function() { return 0; });
    var last24hPeriods = hourlyRange.map(function(row) {
      var p = String(row.period);
      return (p.endsWith('Z') || p.includes('+')) ? p : p + 'Z';
    });
    var hourLabels24 = hourlyRange.map(function(row) {
      var p = String(row.period);
      var d = new Date((p.endsWith('Z') || p.includes('+')) ? p : p + 'Z');
      return String(d.getUTCHours()).padStart(2, '0');
    });
    while (last24hHourly.length < 24) {
      last24hHourly.push(0);
      hourLabels24.push('--');
      last24hPeriods.push('--');
    }
    var last24hTotal = last24hHourly.reduce(function(a, b) { return a + b; }, 0);

    var privateRepoSet = new Set(privateRepos);
    var activityRows24h = [];
    try {
      activityRows24h = await get(`/stats/activity-range?since=${encodeURIComponent(sinceHour.toISOString())}&until=${encodeURIComponent(untilHour.toISOString())}`);
      for (var ai = 0; ai < activityRows24h.length; ai++) {
        var row = activityRows24h[ai];
        if (!row || row.author_login !== myLogin) continue;

        var committedAt = new Date((String(row.committed_at).endsWith('Z') || String(row.committed_at).includes('+')) ? row.committed_at : row.committed_at + 'Z');
        committedAt.setUTCMinutes(0, 0, 0);
        var period = committedAt.toISOString().replace('.000Z', 'Z');

        for (var hi = 0; hi < last24hPeriods.length; hi++) {
          if (last24hPeriods[hi] === period) {
            last24hHourly[hi]++;
            break;
          }
        }
      }
    } catch {}

    var unique24hMyCommits = activityRows24h.filter(function(row) { return row && row.author_login === myLogin; });
    last24hTotal = unique24hMyCommits.length;
    var ossCommits24h = unique24hMyCommits.filter(function(row) { return row && row.repo && !privateRepoSet.has(row.repo); }).length;

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
        mostActiveRepoWeek, mostActiveRepoWeekTotal,
      },
      lastWeekHourly: last24hHourly,
      last24hTotal,
      ossCommits24h,
      last24hPeriods,
      lastWeekDaily,
      hourLabels: hourLabels24,
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
