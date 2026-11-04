// traffic-hub: one private page with human traffic and red flags across all our projects.
// Daily cron copies aggregated counts from each project's own counter into DB, plus
// Cloudflare edge/RUM analytics per zone. Secrets: ACCESS_KEY (URL segment), CF_TOKEN
// (Analytics read), UMAMI_USER/UMAMI_PASS, SHEQ_URL, PAGINAS_URL, SPROUT_URL.
const BACKFILL_DAYS = 14;
const KEEP_DAYS = 120;
const UMAMI = { url: 'https://analytics.paginasemetaforas.pt', site: '876a846b-d38c-4a75-948c-512442623667' };
const CF_ACCOUNT = '6557c80ce116e6b15e064bf7e9a11e3c';
const TAN = { account: '6bdaa6d2ee4012dc5d0c267b26d491bc', kv: '2b3133c2c24f482ba1c8319f46c3a7b2' };
// Zones we own (client zones stay out).
const ZONES = ['cognixhub.com', 'gymboreeclasses.pt', 'leadshortcut.com', 'letsprout.co', 'parentclasses.org', 'playandmusic.pt', 'playlabacademy.com'];

// group: tools = people using our tools/dashboards; landings = people visiting public pages.
export const SITES = {
  soa:          { label: 'Dashboard SOA',         group: 'tools' },
  anft:         { label: 'Dashboard ANFT',        group: 'tools' },
  tan:          { label: 'Dashboard Tan',         group: 'tools' },
  sheq:         { label: 'SHEQ One',              group: 'tools' },
  paginas_app:  { label: 'Mindwink / Páginas (app)', group: 'tools' },
  sprout_app:   { label: 'Sprout (app + studio)', group: 'tools' },
  ler:          { label: 'Lê Comigo (ferramenta)',group: 'tools' },
  foco:         { label: 'Foco (ferramenta)',     group: 'tools' },
  saldo_app:    { label: 'Saldo (app)',           group: 'tools' },
  ls_radar:     { label: 'LeadShortcut Radar',    group: 'tools' },
  ls_leaks:     { label: 'Revenue Leak Radar',    group: 'tools' },
  playlab_aulas:{ label: 'Playlab (aulas)',       group: 'tools' },
  dance:        { label: 'DanceLab',              group: 'tools' },
  missao_brilho:{ label: 'Missão Brilho',         group: 'tools' },
  leadshortcut: { label: 'LeadShortcut',          group: 'landings' },
  ls_lps:       { label: 'LeadShortcut (lps)',    group: 'landings' },
  pam:          { label: 'paginasemetaforas.pt',  group: 'landings' },
  mindwink:     { label: 'Mindwink (landing)',    group: 'landings' },
  foco_lp:      { label: 'Foco (landing)',        group: 'landings' },
  ler_lp:       { label: 'Lê Comigo (landing)',   group: 'landings' },
  saldo_lp:     { label: 'Saldo (landing)',       group: 'landings' },
  parenting:    { label: 'Parenting (5 idiomas)', group: 'landings' },
  'parentclasses.org':  { label: 'parentclasses.org',     group: 'landings' },
  parentclasses_go:     { label: 'ParentClasses (links go.)', group: 'landings' },
  parentclasses_plano:  { label: 'ParentClasses plano',   group: 'landings' },
  playandmusic:         { label: 'playandmusic.pt',       group: 'landings' },
  'gymboreeclasses.pt': { label: 'gymboreeclasses.pt',    group: 'landings' },
  'playlabacademy.com': { label: 'playlabacademy.com',    group: 'landings' },
  playlab_blog:         { label: 'Playlab (blog)',        group: 'landings' },
  'letsprout.co':       { label: 'letsprout.co',          group: 'landings' },
};
const PUB_MAP = { mindwink: 'mindwink', foco: 'foco_lp', ler: 'ler_lp', saldo: 'saldo_lp', parenting: 'parenting' };
const HOST_MAP = { 'soa.cognixhub.com': 'soa', 'anft.cognixhub.com': 'anft', 'plano.parentclasses.org': 'parentclasses_plano', 'app.letsprout.co': 'sprout_app', 'studio.letsprout.co': 'sprout_app', 'radar.leadshortcut.com': 'ls_radar', 'leaks.leadshortcut.com': 'ls_leaks', 'lps.leadshortcut.com': 'ls_lps', 'aulas.playlabacademy.com': 'playlab_aulas', 'blog.playlabacademy.com': 'playlab_blog', 'dance.playlabacademy.com': 'dance', 'missao-brilho.playlabacademy.com': 'missao_brilho' };
const RUM_ZONES = ['gymboreeclasses.pt', 'playlabacademy.com', 'letsprout.co', 'parentclasses.org'];
// Only hosts where an edge HTML 200 means a person: SOA/ANFT sit behind a key (anything else gets 401).
// Radar, Revenue Leak, LPS and Sprout Studio are single-page apps that answer 200 with index.html on any
// path, so their edge counts were scanner probes (verified 2026-11-04: 1 request from PT in 14 days).
const EDGE_HOSTS = { 'cognixhub.com': ['soa.cognixhub.com', 'anft.cognixhub.com'] };
const KEYED = new Set(['soa.cognixhub.com', 'anft.cognixhub.com']);
const NOISE = /\/(favicon\.ico|robots\.txt|sitemap[^/]*\.xml|ads\.txt|manifest\.json|sw\.js)$|\.(xml|txt|json|js|css|png|jpg|svg|ico|webmanifest)$/i;
// Source quality, best first. One row per site/day wins.
const RANK = { 'uniq-js': 0, 'opens-js': 0, 'app-db': 0, 'views-js': 1, 'visits-log': 1, 'authed-edge': 1, rum: 2, 'clicks-nobot': 3, edge: 4 };
const KIND = { 'uniq-js': 'visitantes únicos', 'opens-js': 'aberturas (não pessoas distintas)', 'app-db': 'utilizadores ativos', 'views-js': 'visualizações', 'visits-log': 'visitas registadas', 'authed-edge': 'acessos com chave', rum: 'Web Analytics (amostrado)', 'clicks-nobot': 'cliques humanos', edge: 'visitas na Cloudflare (pode incluir bots)' };

const iso = (d) => d.toISOString().slice(0, 10);
const dayAgo = (n) => iso(new Date(Date.now() - n * 864e5));
const since = () => dayAgo(BACKFILL_DAYS);
const cls = (st) => st < 300 ? '2xx' : st < 400 ? '3xx' : st < 500 ? '4xx' : '5xx';

async function batch(env, sql, rows, bind) {
  const st = env.DB.prepare(sql);
  for (let i = 0; i < rows.length; i += 50) await env.DB.batch(rows.slice(i, i + 50).map(r => st.bind(...bind(r))));
}
const putDaily = (env, rows) => batch(env, 'INSERT INTO daily(day,site,source,visitors,views) VALUES(?,?,?,?,?) ON CONFLICT(day,site,source) DO UPDATE SET visitors=excluded.visitors, views=excluded.views', rows, r => [r.day, r.site, r.source, r.visitors, r.views]);
const all = async (db, sql, ...p) => (await db.prepare(sql).bind(...p).all()).results;
const cfH = (env) => ({ authorization: 'Bearer ' + env.CF_TOKEN, 'content-type': 'application/json' });
async function gql(env, query) {
  const r = await (await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: cfH(env), body: JSON.stringify({ query }) })).json();
  if (r.errors?.length) throw new Error(r.errors[0].message.slice(0, 80));
  return r.data.viewer;
}
async function zoneIds(env) {
  const out = {};
  for (let p = 1; ; p++) {
    const j = await (await fetch(`https://api.cloudflare.com/client/v4/zones?per_page=50&page=${p}`, { headers: cfH(env) })).json();
    for (const z of j.result || []) if (ZONES.includes(z.name)) out[z.name] = z.id;
    if (p >= (j.result_info?.total_pages || 1)) break;
  }
  return out;
}

// ---------- people collectors: each returns rows for `daily` ----------
const collectors = {
  async pub(env, s) {
    const r = await all(env.PUB, "SELECT day, project, total FROM daily_counts WHERE event='view' AND day>=?", s);
    return r.filter(x => PUB_MAP[x.project]).map(x => ({ day: x.day, site: PUB_MAP[x.project], source: 'uniq-js', visitors: x.total, views: x.total }));
  },
  // Same source as ler.cognixhub.com/admin ("Aberturas").
  async ler(env, s) {
    const r = await all(env.LER, "SELECT day, SUM(count) n FROM usage_daily WHERE event_type='page_open' AND day>=? GROUP BY day", s);
    return r.map(x => ({ day: x.day, site: 'ler', source: 'opens-js', visitors: x.n, views: x.n }));
  },
  async foco(env, s) {
    const r = await all(env.FOCO, "SELECT date(created_at/1000,'unixepoch') day, COUNT(DISTINCT visitor_id) v, COUNT(*) n FROM usage_events WHERE date(created_at/1000,'unixepoch')>=? GROUP BY day", s);
    return r.map(x => ({ day: x.day, site: 'foco', source: 'uniq-js', visitors: x.v, views: x.n }));
  },
  async folga(env, s) {
    const r = await all(env.FOLGA, "SELECT day, COUNT(DISTINCT user_id) v, COUNT(*) n FROM usage_events WHERE event='visit' AND day>=? GROUP BY day", s);
    return r.map(x => ({ day: x.day, site: 'saldo_app', source: 'uniq-js', visitors: x.v, views: x.n }));
  },
  async ls(env, s) {
    const r = await all(env.LS, "SELECT p.dia day, SUM(p.vistas) n, (SELECT COUNT(*) FROM visitantes v WHERE v.dia=p.dia) u FROM pageviews p WHERE p.dia>=? GROUP BY p.dia", s);
    return r.map(x => ({ day: x.day, site: 'leadshortcut', source: 'uniq-js', visitors: x.u, views: x.n }));
  },
  async pcgo(env, s) {
    const r = await all(env.PCGO, "SELECT day, COUNT(DISTINCT ua||'|'||country) v, COUNT(*) n FROM clicks WHERE bot=0 AND day>=? GROUP BY day", s);
    return r.map(x => ({ day: x.day, site: 'parentclasses_go', source: 'clicks-nobot', visitors: x.v, views: x.n }));
  },
  async pam(env, s) {
    const r = await all(env.PAM, "SELECT day, COUNT(*) n, COUNT(DISTINCT COALESCE(country,'')||'|'||COALESCE(ref,'')) v FROM pageviews WHERE day>=? GROUP BY day", s);
    return r.map(x => ({ day: x.day, site: 'playandmusic', source: 'views-js', visitors: x.v, views: x.n }));
  },
  async umami(env, s) {
    if (!env.UMAMI_PASS) return [];
    const lg = await fetch(UMAMI.url + '/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: env.UMAMI_USER || 'admin', password: env.UMAMI_PASS }) });
    if (!lg.ok) throw new Error('umami login ' + lg.status);
    const { token } = await lg.json();
    const a = new Date(s + 'T00:00:00Z').getTime(), b = Date.now();
    const r = await fetch(`${UMAMI.url}/api/websites/${UMAMI.site}/pageviews?startAt=${a}&endAt=${b}&unit=day&timezone=UTC`, { headers: { authorization: 'Bearer ' + token } });
    if (!r.ok) throw new Error('umami pageviews ' + r.status);
    const j = await r.json(), m = {};
    for (const p of j.pageviews || []) (m[p.x.slice(0, 10)] ||= {}).n = p.y;
    for (const p of j.sessions || []) (m[p.x.slice(0, 10)] ||= {}).v = p.y;
    return Object.entries(m).map(([day, o]) => ({ day, site: 'pam', source: 'uniq-js', visitors: o.v || 0, views: o.n || 0 }));
  },
  // Cloudflare Web Analytics (browser beacon, bot:0). Sampled: numbers move in steps of ~10.
  async rum(env, s) {
    if (!env.CF_TOKEN) return [];
    const v = await gql(env, `{viewer{accounts(filter:{accountTag:"${CF_ACCOUNT}"}){rumPageloadEventsAdaptiveGroups(limit:5000,filter:{date_geq:"${s}",bot:0}){count dimensions{date requestHost} sum{visits}}}}}`);
    const acc = {};
    for (const g of v.accounts[0].rumPageloadEventsAdaptiveGroups) {
      const host = g.dimensions.requestHost.replace(/^www\./, '');
      if (host === 'api.letsprout.co') continue;
      const site = HOST_MAP[host] || RUM_ZONES.find(z => host === z || host.endsWith('.' + z));
      if (!site || !SITES[site]) continue;
      const k = g.dimensions.date + '|' + site;
      const o = (acc[k] ||= { day: g.dimensions.date, site, source: 'rum', visitors: 0, views: 0 });
      o.visitors += g.sum.visits; o.views += g.count;
    }
    return Object.values(acc);
  },
  // Hosts without a browser beacon: count HTML loads (200) at the edge. SOA/ANFT sit behind a key
  // (anything else gets 401), so theirs are real accesses; the others may include some bots.
  async dash(env, s) {
    if (!env.CF_TOKEN) return [];
    const ids = await zoneIds(env), out = [];
    for (const [zone, hosts] of Object.entries(EDGE_HOSTS)) {
      const v = await gql(env, `{viewer{zones(filter:{zoneTag:"${ids[zone]}"}){httpRequestsAdaptiveGroups(limit:2000,filter:{date_geq:"${s}",requestSource:"eyeball",edgeResponseStatus:200,edgeResponseContentTypeName:"html",clientRequestHTTPHost_in:${JSON.stringify(hosts)}}){count dimensions{date clientRequestHTTPHost} sum{visits}}}}}`);
      for (const g of v.zones[0].httpRequestsAdaptiveGroups) { const h = g.dimensions.clientRequestHTTPHost; out.push({ day: g.dimensions.date, site: HOST_MAP[h], source: KEYED.has(h) ? 'authed-edge' : 'edge', visitors: g.sum.visits, views: g.count }); }
    }
    return out;
  },
  // Tan dashboard keeps its own visit log in KV (other account): visit:<ISO>:<id>
  async tan(env, s) {
    if (!env.CF_TOKEN) return [];
    const base = `https://api.cloudflare.com/client/v4/accounts/${TAN.account}/storage/kv/namespaces/${TAN.kv}/keys`, m = {};
    let cursor = '';
    do {
      const j = await (await fetch(`${base}?limit=1000&prefix=visit:${cursor ? '&cursor=' + cursor : ''}`, { headers: cfH(env) })).json();
      if (!j.success) throw new Error('tan kv');
      for (const k of j.result) { const d = k.name.slice(6, 16); if (d >= s) m[d] = (m[d] || 0) + 1; }
      cursor = j.result_info?.cursor || '';
    } while (cursor);
    return Object.entries(m).map(([day, n]) => ({ day, site: 'tan', source: 'visits-log', visitors: n, views: n }));
  },
  // SHEQ One: per-guest events (last ~150). Distinct guests per day; internal test guests excluded.
  async sheq(env, s) {
    if (!env.SHEQ_URL) return [];
    const res = await fetch(env.SHEQ_URL + '&f=json', { headers: { 'user-agent': 'Mozilla/5.0 traffic-hub' } });
    if (!res.ok) throw new Error('sheq http ' + res.status);
    const j = await res.json(), m = {};
    for (const e of j.events || []) {
      if (/nuno|claude|teste/i.test(e.label || '')) continue;
      const d = (e.ts || '').slice(0, 10); if (d < s) continue;
      (m[d] ||= new Set()).add(e.label);
    }
    return Object.entries(m).map(([day, set]) => ({ day, site: 'sheq', source: 'uniq-js', visitors: set.size, views: set.size }));
  },
  // Our own apps expose {days:[{day,active,signups,...}]} behind a key (see /api/metrics in paginas-app, /api/usage in sprout).
  async paginas(env, s) { return appUsage(env.PAGINAS_URL, 'paginas_app', s); },
  async sprout(env, s) { return appUsage(env.SPROUT_URL, 'sprout_app', s); },
};
async function appUsage(url, site, s) {
  if (!url) return [];
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(site + ' http ' + res.status);
  const j = await res.json();
  return (j.days || []).filter(d => d.day >= s).map(d => ({ day: d.day, site, source: 'app-db', visitors: d.active, views: d.signups || 0 }));
}

// ---------- edge collector: request mix and top paths per zone, for red flags ----------
// Cloudflare's own Early Hints prefetcher (user agents "nginx-ssl early hints" and "fl2 early hints") made ~98% of all 5xx in
// our zones and never reaches a visitor, so it is excluded from the mix and from error paths.
async function collectEdge(env, s) {
  if (!env.CF_TOKEN) return 'edge:skip';
  const ids = await zoneIds(env);
  const zrows = [], prows = [];
  for (const [zone, id] of Object.entries(ids)) {
    // hosting-panel hostnames (cPanel/Hostinger) are not sites of ours; scanners hitting them produce 525s
    const panel = JSON.stringify(['phpmyadmin', 'webmail', 'cpanel', 'ftp', 'autoconfig', 'autodiscover'].map(h => `${h}.${zone}`));
    const v = await gql(env, `{viewer{zones(filter:{zoneTag:"${id}"}){
      mix: httpRequestsAdaptiveGroups(limit:2000,filter:{date_geq:"${s}",userAgent_notlike:"%early hints%",clientRequestHTTPHost_notin:${panel}}){count dimensions{date edgeResponseStatus}}
      html: httpRequestsAdaptiveGroups(limit:400,filter:{date_geq:"${s}",requestSource:"eyeball",edgeResponseStatus:200,edgeResponseContentTypeName:"html"}){count dimensions{date} sum{visits}}
      pages: httpRequestsAdaptiveGroups(limit:800,filter:{date_geq:"${dayAgo(7)}",requestSource:"eyeball",edgeResponseStatus:200,edgeResponseContentTypeName:"html"},orderBy:[count_DESC]){count dimensions{date clientRequestHTTPHost clientRequestPath} sum{visits}}
      errs: httpRequestsAdaptiveGroups(limit:300,filter:{date_geq:"${dayAgo(1)}",requestSource:"eyeball",edgeResponseStatus_geq:400,userAgent_notlike:"%early hints%",clientRequestHTTPHost_notin:${panel}},orderBy:[count_DESC]){count dimensions{date clientRequestHTTPHost clientRequestPath edgeResponseStatus clientCountryName}}
    }}}`);
    const z = v.zones[0], m = {};
    for (const g of z.mix) { const k = g.dimensions.date + '|' + cls(g.dimensions.edgeResponseStatus); m[k] = (m[k] || 0) + g.count; }
    for (const [k, n] of Object.entries(m)) { const [day, c] = k.split('|'); zrows.push({ day, zone, cls: c, n, visits: 0 }); }
    for (const g of z.html) zrows.push({ day: g.dimensions.date, zone, cls: 'html', n: g.count, visits: g.sum.visits });
    for (const g of z.pages) if (!NOISE.test(g.dimensions.clientRequestPath)) prows.push({ day: g.dimensions.date, zone, host: g.dimensions.clientRequestHTTPHost, path: g.dimensions.clientRequestPath.slice(0, 160), cls: 'page', n: g.count, visits: g.sum.visits, country: '' });
    for (const g of z.errs) prows.push({ day: g.dimensions.date, zone, host: g.dimensions.clientRequestHTTPHost, path: g.dimensions.clientRequestPath.slice(0, 160), cls: String(g.dimensions.edgeResponseStatus), n: g.count, visits: 0, country: g.dimensions.clientCountryName });
  }
  await batch(env, 'INSERT INTO zone_daily(day,zone,cls,requests,visits) VALUES(?,?,?,?,?) ON CONFLICT(day,zone,cls) DO UPDATE SET requests=excluded.requests, visits=excluded.visits', zrows, r => [r.day, r.zone, r.cls, r.n, r.visits]);
  // paths: replace the window we just read so stale ranks don't linger
  await env.DB.prepare("DELETE FROM path_daily WHERE (cls='page' AND day>=?) OR (cls<>'page' AND day>=?)").bind(dayAgo(7), dayAgo(1)).run();
  await batch(env, 'INSERT INTO path_daily(day,zone,host,path,cls,requests,visits,country) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(day,zone,host,path,cls,country) DO UPDATE SET requests=requests+excluded.requests, visits=visits+excluded.visits', prows, r => [r.day, r.zone, r.host, r.path, r.cls, r.n, r.visits, r.country]);
  return `edge:${zrows.length}/${prows.length}`;
}

export async function collect(env) {
  const s = since(), notes = [];
  for (const [name, fn] of Object.entries(collectors)) {
    try { const rows = await fn(env, s); await putDaily(env, rows); notes.push(`${name}:${rows.length}`); }
    catch (e) { notes.push(`${name}:ERR ${String(e.message || e).slice(0, 80)}`); }
  }
  try { notes.push(await collectEdge(env, s)); } catch (e) { notes.push('edge:ERR ' + String(e.message || e).slice(0, 80)); }
  const old = dayAgo(KEEP_DAYS);
  await env.DB.batch([env.DB.prepare('DELETE FROM daily WHERE day<?').bind(old), env.DB.prepare('DELETE FROM zone_daily WHERE day<?').bind(old), env.DB.prepare('DELETE FROM path_daily WHERE day<?').bind(dayAgo(30)), env.DB.prepare('DELETE FROM runs WHERE at<?').bind(old)]);
  await env.DB.prepare('INSERT OR REPLACE INTO runs(at,ok,note) VALUES(?,?,?)').bind(new Date().toISOString(), notes.some(n => n.includes('ERR')) ? 0 : 1, notes.join(' ')).run();
  return notes;
}

// ---------- analysis ----------
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
function flags(zoneRows, pathRows, rumBySite) {
  const today = dayAgo(0), yest = dayAgo(1), out = [];
  const z = {}; // zone -> cls -> day -> {n,visits}
  for (const r of zoneRows) ((z[r.zone] ||= {})[r.cls] ||= {})[r.day] = r;
  const base = (zone, c, metric = 'requests') => median([1, 2, 3, 4, 5, 6, 7].map(i => z[zone]?.[c]?.[dayAgo(i + 1)]?.[metric] || 0));
  const topPaths = (zone, day, pred, n = 4) => pathRows.filter(p => p.zone === zone && p.day === day && pred(p)).sort((a, b) => b.requests - a.requests).slice(0, n);
  for (const zone of ZONES) {
    if (!z[zone]) continue;
    for (const day of [yest, today]) {
      const scale = day === today ? Math.max(0.25, (Date.now() % 864e5) / 864e5) : 1; // today is partial
      const r4 = z[zone]['4xx']?.[day]?.requests || 0, b4 = base(zone, '4xx') * scale;
      const r5 = z[zone]['5xx']?.[day]?.requests || 0, b5 = base(zone, '5xx') * scale;
      const hv = z[zone].html?.[day]?.visits || 0, bh = base(zone, 'html', 'visits') * scale;
      const tot = ['2xx', '3xx', '4xx', '5xx'].reduce((t, c) => t + (z[zone][c]?.[day]?.requests || 0), 0), bt = ['2xx', '3xx', '4xx', '5xx'].reduce((t, c) => t + base(zone, c), 0) * scale;
      const when = day === today ? 'hoje' : 'ontem';
      if (tot >= 20000 && tot >= 4 * bt) out.push({ sev: 'high', zone, day, title: `Possível DDoS em ${zone} (${when})`, detail: `${fmt(tot)} pedidos, ${Math.round(tot / Math.max(1, bt))}× o normal.`, paths: topPaths(zone, day, p => p.cls !== 'page') });
      const probe = topPaths(zone, day, p => p.cls !== 'page' && /\.(sql|bak|env|git|php|json|xml|yml|zip)|wp-|\.hg|\.svn|phpmyadmin|admin|_ignition|\.aws|config/i.test(p.path), 5);
      if (r4 >= 1000 && r4 >= 3 * b4 || probe.reduce((t, p) => t + p.requests, 0) >= 150)
        out.push({ sev: probe.length ? 'med' : 'low', zone, day, title: `${probe.length ? 'Sondagem de vulnerabilidades' : 'Pico de erros 4xx'} em ${zone} (${when})`, detail: `${fmt(r4)} respostas 4xx (normal ≈ ${fmt(b4)}). ${probe.length ? 'Caminhos típicos de scanners; sem indício de sucesso enquanto responderem 4xx.' : ''}`, paths: probe.length ? probe : topPaths(zone, day, p => p.cls.startsWith('4')) });
      if (r5 >= 200 && r5 >= 2 * b5) out.push({ sev: r5 >= 0.05 * tot ? 'high' : 'med', zone, day, title: `Erros de servidor (5xx) em ${zone} (${when})`, detail: `${fmt(r5)} respostas 5xx (normal ≈ ${fmt(b5)}; ${(100 * r5 / Math.max(1, tot)).toFixed(1)}% dos pedidos). Vêm da origem, não da Cloudflare.`, paths: topPaths(zone, day, p => p.cls.startsWith('5')) });
      if (hv >= 200 && hv >= 2.5 * bh) {
        const paths = topPaths(zone, day, p => p.cls === 'page'), cover = paths.reduce((t, p) => t + p.visits, 0) / hv;
        out.push({ sev: 'info', zone, day, title: `Pico de visitas em ${zone} (${when})`, detail: `${fmt(hv)} visitas HTML (normal ≈ ${fmt(bh)}).${cover < 0.3 ? ' As visitas estão espalhadas por muitos caminhos diferentes, o que é típico de scanners e não de pessoas.' : ''}`, paths });
      }
    }
  }
  // bot share: edge HTML visits vs real-browser (RUM) visits over the last 7 full days
  const botty = ZONES.filter(zone => z[zone]).map(zone => { const edge7 = [1, 2, 3, 4, 5, 6, 7].reduce((t, i) => t + (z[zone].html?.[dayAgo(i)]?.visits || 0), 0), rum7 = rumBySite[zone] || 0; return { zone, edge7, rum7, share: rum7 && edge7 > 500 ? 1 - rum7 / edge7 : 0 }; }).filter(b => b.share >= 0.85);
  if (botty.length) out.push({ sev: 'med', zone: '', day: yest, title: `Tráfego maioritariamente automático em ${botty.length} domínio${botty.length > 1 ? 's' : ''}`, detail: `Nos últimos 7 dias: ${botty.map(b => `${b.zone} ≈ ${Math.round(100 * b.share)}% bots (${fmt(b.edge7)} visitas na Cloudflare, ${fmt(b.rum7)} em browsers reais)`).join('; ')}. As tabelas abaixo usam o contador de browsers reais, por isso não inflacionam.`, paths: [] });
  const order = { high: 0, med: 1, low: 2, info: 3 };
  return out.sort((a, b) => order[a.sev] - order[b.sev] || b.day.localeCompare(a.day));
}

// ---------- page ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => new Intl.NumberFormat('pt-PT').format(Math.round(n));
const pct = (now, prev) => prev ? Math.round((now - prev) / prev * 100) : (now ? null : 0);
const deltaCell = (d) => d == null ? '<td class="mu" data-v="-1e9">novo</td>' : `<td class="${d > 0 ? 'up' : d < 0 ? 'dn' : 'mu'}" data-v="${d}">${d > 0 ? '+' : ''}${d}%</td>`;
const num = (n, extra = '') => `<td data-v="${Math.round(n)}">${fmt(n)}${extra}</td>`;

async function page(env) {
  const from = dayAgo(60);
  const [rows, zoneRows, pathRows, runs] = await Promise.all([
    all(env.DB, 'SELECT day,site,source,visitors,views FROM daily WHERE day>=?', from),
    all(env.DB, 'SELECT day,zone,cls,requests,visits FROM zone_daily WHERE day>=?', dayAgo(9)),
    all(env.DB, 'SELECT day,zone,host,path,cls,requests,visits,country FROM path_daily WHERE day>=?', dayAgo(8)),
    all(env.DB, 'SELECT at,ok,note FROM runs ORDER BY at DESC LIMIT 1'),
  ]);
  const run = runs[0];
  const best = {}, srcOf = {}, last = {};
  for (const r of rows) {
    const k = r.site + '|' + r.day, c = best[k];
    if (!c || (RANK[r.source] ?? 9) < (RANK[c.source] ?? 9)) best[k] = r;
  }
  for (const r of Object.values(best)) { (srcOf[r.site] ||= new Set()).add(r.source); if (r.visitors > 0 && (!last[r.site] || r.day > last[r.site])) last[r.site] = r.day; }
  const val = (site, i) => best[site + '|' + dayAgo(i)]?.visitors || 0;
  const sum = (site, a, b) => { let t = 0; for (let i = a; i < b; i++) t += val(site, i); return t; }; // days ago in [a,b)
  const rumBySite = {};
  for (const r of rows) if (r.source === 'rum' && r.day >= dayAgo(7) && r.day < dayAgo(0)) rumBySite[r.site] = (rumBySite[r.site] || 0) + r.visitors;
  const alerts = flags(zoneRows, pathRows, rumBySite);
  const today = dayAgo(0);

  const spark = (site) => {
    const v = [...Array(30)].map((_, i) => val(site, 29 - i)), m = Math.max(1, ...v);
    return `<svg viewBox="0 0 120 28" width="120" height="28" aria-hidden="true"><polyline points="${v.map((x, i) => `${(i * 120 / 29).toFixed(1)},${(26 - x / m * 24).toFixed(1)}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  };
  const kind = (site) => { const s = srcOf[site]; if (!s) return 'sem fonte ligada'; return KIND[[...s].sort((a, b) => (RANK[a] ?? 9) - (RANK[b] ?? 9))[0]] || '—'; };
  const fresh = (site) => {
    if (!last[site]) return '<td class="mu" data-v="-1e9">—</td>';
    const age = Math.round((Date.parse(today) - Date.parse(last[site])) / 864e5);
    return `<td class="${age >= 7 ? 'dn' : age >= 3 ? 'wn' : 'mu'}" data-v="${-age}">${age === 0 ? 'hoje' : age === 1 ? 'ontem' : `há ${age} dias`}</td>`;
  };
  const groupRows = (group) => Object.entries(SITES).filter(([, s]) => s.group === group).map(([id, s]) => ({ id, s, d0: val(id, 0), d1: val(id, 1), w: sum(id, 1, 8), wp: sum(id, 8, 15), m: sum(id, 1, 31) })).sort((a, b) => b.w - a.w || b.m - a.m);
  const ROWS = { tools: groupRows('tools'), landings: groupRows('landings') };
  const section = (group, title, sub) => {
    const list = ROWS[group];
    const tot = (k) => list.reduce((t, x) => t + x[k], 0);
    const body = list.map(x => `<tr><th scope="row">${esc(x.s.label)}<small>${esc(kind(x.id))}</small></th>${num(x.d0)}${num(x.d1)}<td data-v="${x.w}"><b>${fmt(x.w)}</b></td>${deltaCell(pct(x.w, x.wp))}${num(x.m)}${fresh(x.id)}<td class="sp">${spark(x.id)}</td></tr>`).join('');
    return `<section id="${group}"><h2>${title}</h2><p class="sub">${sub} Clica num cabeçalho para ordenar.</p><div class="tw"><table class="sortable"><thead><tr><th>Projeto</th><th>Hoje</th><th>Ontem</th><th class="sorted-desc">7 dias</th><th>vs 7 ant.</th><th>30 dias</th><th>Último registo</th><th class="nosort">30 dias</th></tr></thead><tbody>${body}</tbody><tfoot><tr><th>Total</th><td>${fmt(tot('d0'))}</td><td>${fmt(tot('d1'))}</td><td>${fmt(tot('w'))}</td>${deltaCell(pct(tot('w'), tot('wp')))}<td>${fmt(tot('m'))}</td><td></td><td></td></tr></tfoot></table></div></section>`;
  };
  const kpi = (group) => ({ w: ROWS[group].reduce((t, x) => t + x.w, 0), wp: ROWS[group].reduce((t, x) => t + x.wp, 0) });
  const L = kpi('landings'), Tl = kpi('tools');
  const kpiCard = (id, n, label, d) => `<button type="button" class="kpi" data-panel="${id}" aria-expanded="false" aria-controls="panel-${id}"><b>${fmt(n)}</b><span>${label}</span>${d == null ? '' : `<em class="${d > 0 ? 'up' : d < 0 ? 'dn' : 'mu'}">${d > 0 ? '+' : ''}${d}% vs 7 dias anteriores</em>`}<i>detalhe ▾</i></button>`;
  // KPI breakdowns: where each aggregate comes from, biggest first, with share of the total
  const breakdown = (group, total, prev) => {
    const list = ROWS[group].filter(x => x.w || x.wp);
    const rows = list.map(x => { const d = x.w - x.wp; return `<tr><th scope="row">${esc(x.s.label)}<small>${esc(kind(x.id))}</small></th><td data-v="${x.w}">${fmt(x.w)}</td><td data-v="${total ? x.w / total : 0}"><span class="bar" style="--w:${total ? (100 * x.w / total).toFixed(1) : 0}%"></span>${total ? Math.round(100 * x.w / total) : 0}%</td><td data-v="${x.wp}">${fmt(x.wp)}</td><td class="${d > 0 ? 'up' : d < 0 ? 'dn' : 'mu'}" data-v="${d}">${d > 0 ? '+' : ''}${fmt(d)}</td>${deltaCell(pct(x.w, x.wp))}</tr>`; }).join('');
    const d = total - prev;
    return `<p class="sub">Soma dos últimos 7 dias completos (${dayAgo(7)} a ${dayAgo(1)}): ${fmt(total)}, contra ${fmt(prev)} nos 7 anteriores (${d >= 0 ? '+' : ''}${fmt(d)}). A coluna "Δ abs." diz quem fez o total mexer.</p><div class="tw"><table class="sortable"><thead><tr><th>Projeto</th><th class="sorted-desc">7 dias</th><th>Quota</th><th>7 ant.</th><th>Δ abs.</th><th>Δ %</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="mu">sem dados</td></tr>'}</tbody></table></div>`;
  };
  const sevLabel = { high: 'Grave', med: 'Atenção', low: 'Ruído', info: 'Pico' };
  const alertPanel = () => { const a = alerts.filter(x => x.sev === 'high' || x.sev === 'med'); return a.length ? `<ul class="plain">${a.map(x => `<li><b class="${x.sev}">${sevLabel[x.sev]}</b> ${esc(x.title)}${x.zone ? ` <span class="mu">· ${esc(x.zone)}</span>` : ''}</li>`).join('')}</ul><p class="sub"><a href="#alertas">Ver os detalhes na secção de alertas</a>.</p>` : '<p class="sub">Nenhum alerta grave ou de atenção nas últimas 48 h.</p>'; };
  const noSourcePanel = () => { const ids = Object.keys(SITES).filter(k => !srcOf[k]); return ids.length ? `<ul class="plain">${ids.map(k => `<li>${esc(SITES[k].label)} <span class="mu">· ${SITES[k].group === 'tools' ? 'ferramenta' : 'landing'}</span></li>`).join('')}</ul><p class="sub">Sem contador próprio nem beacon, por isso ainda não aparecem com números.</p>` : '<p class="sub">Todos os projetos têm pelo menos uma fonte ligada.</p>'; };
  const panels = `<div id="panel-landings" class="panel" hidden><h3>Pessoas nas landings · de onde vêm</h3>${breakdown('landings', L.w, L.wp)}</div><div id="panel-tools" class="panel" hidden><h3>Utilizadores das ferramentas · de onde vêm</h3>${breakdown('tools', Tl.w, Tl.wp)}</div><div id="panel-alerts" class="panel" hidden><h3>Alertas a precisar de olhar</h3>${alertPanel()}</div><div id="panel-nosource" class="panel" hidden><h3>Projetos sem fonte ligada</h3>${noSourcePanel()}</div>`;
  const errs = (run?.note || '').split(' ').filter(n => n.includes('ERR'));

  // top pages: yesterday vs each page's own 6-day average, our zones only
  const pg = {};
  for (const p of pathRows) if (p.cls === 'page' && p.day < today) { const k = p.host + p.path; (pg[k] ||= { host: p.host, path: p.path, days: {} }).days[p.day] = (pg[k].days[p.day] || 0) + p.visits; }
  const pages = Object.values(pg).map(p => { const y = p.days[dayAgo(1)] || 0; const prev = [2, 3, 4, 5, 6, 7].map(i => p.days[dayAgo(i)] || 0); return { ...p, y, avg: prev.reduce((a, b) => a + b, 0) / 6 }; }).filter(p => p.y >= 10).sort((a, b) => b.y - a.y).slice(0, 15);
  const pagesHtml = pages.map(p => `<tr><th scope="row"><span class="h">${esc(p.host)}</span>${esc(p.path)}</th>${num(p.y)}${num(p.avg)}${deltaCell(p.avg ? Math.round((p.y - p.avg) / p.avg * 100) : null)}</tr>`).join('');

  // infra mix per zone, last 7 full days
  const zm = {};
  for (const r of zoneRows) if (r.day >= dayAgo(7) && r.day < today) { const o = (zm[r.zone] ||= { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, html: 0 }); o[r.cls] += r.cls === 'html' ? r.visits : r.requests; }
  const infra = ZONES.filter(z => zm[z]).map(z => { const o = zm[z], tot = o['2xx'] + o['3xx'] + o['4xx'] + o['5xx'], rum = rumBySite[z]; return `<tr><th scope="row">${z}</th>${num(tot)}${num(o['4xx'], ` <span class="mu">(${Math.round(100 * o['4xx'] / Math.max(1, tot))}%)</span>`)}<td class="${o['5xx'] > 0.03 * tot ? 'dn' : ''}" data-v="${o['5xx']}">${fmt(o['5xx'])} <span class="mu">(${Math.round(100 * o['5xx'] / Math.max(1, tot))}%)</span></td>${num(o.html)}<td data-v="${rum == null ? -1 : rum}">${rum == null ? '<span class="mu">sem beacon</span>' : `${fmt(rum)} <span class="mu">(≈ ${Math.round(100 - 100 * Math.min(1, rum / Math.max(1, o.html)))}% bots)</span>`}</td></tr>`; }).join('');

  const alertsHtml = alerts.length ? alerts.map(a => `<li class="al ${a.sev}"><b>${sevLabel[a.sev]}</b><div><strong>${esc(a.title)}</strong><p>${esc(a.detail)}</p>${a.paths.length ? `<ul>${a.paths.map(p => `<li><code>${esc(p.host)}${esc(p.path)}</code> ${fmt(p.visits || p.requests)}${p.country ? ` <span class="mu">${esc(p.country)}</span>` : ''}</li>`).join('')}</ul>` : ''}</div></li>`).join('') : '<li class="al ok"><b>OK</b><div><strong>Sem alertas nas últimas 48 h</strong><p>Nenhum pico anormal de pedidos, erros ou sondagens nos domínios próprios.</p></div></li>';

  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Tração</title><style>
:root{--bg:#f6f5f1;--fg:#1b1b1a;--mu:#6b6a65;--card:#fff;--ln:#e4e2db;--up:#1d7a46;--dn:#b3402a;--wn:#9a6700;--ac:#1f4f8f;--hi:#fbe9e4;--me:#fff4d6;--lo:#eef0f3;--in:#e6f0fb;--okc:#e5f3ea}
@media(prefers-color-scheme:dark){:root{--bg:#141413;--fg:#ecebe6;--mu:#9b9a93;--card:#1d1d1b;--ln:#2e2e2b;--up:#5fc88d;--dn:#ee8a73;--wn:#e3b341;--ac:#7fb0ee;--hi:#3a211c;--me:#3a3220;--lo:#262a2f;--in:#1f2d3f;--okc:#1e3327}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
main{max-width:1040px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 2px}
.sub,.foot,.mu{color:var(--mu);font-size:13px}.sub{margin:0 0 10px}.foot{margin:8px 0 0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:16px 0}.kpi{background:var(--card);border:1px solid var(--ln);border-radius:10px;padding:12px 14px}.kpi b{display:block;font-size:26px;line-height:1.1}.kpi span{display:block;color:var(--mu);font-size:13px;margin-top:2px}.kpi em{display:block;font-style:normal;font-size:12px;margin-top:4px}
.tw{overflow-x:auto;background:var(--card);border:1px solid var(--ln);border-radius:10px}table{border-collapse:collapse;width:100%;min-width:720px}th,td{padding:8px 10px;text-align:right;border-bottom:1px solid var(--ln);white-space:nowrap;font-variant-numeric:tabular-nums}
th:first-child,td:first-child{text-align:left}thead th{font-size:12px;color:var(--mu);font-weight:600}tbody th{font-weight:600}th small{display:block;font-weight:400;color:var(--mu);font-size:12px}th .h{display:block;font-weight:400;color:var(--mu);font-size:12px}
tfoot th,tfoot td{font-weight:700;border-bottom:0}tr:last-child td,tr:last-child th{border-bottom:0}.up{color:var(--up)}.dn{color:var(--dn)}.wn{color:var(--wn)}.sp{color:var(--ac);text-align:left}
ol.alerts{list-style:none;padding:0;margin:0;display:grid;gap:8px}.al{display:grid;grid-template-columns:76px 1fr;gap:10px;border:1px solid var(--ln);border-radius:10px;padding:10px 12px;background:var(--card)}.al>b{font-size:12px;align-self:start;padding:2px 6px;border-radius:6px;text-align:center}
.al.high>b{background:var(--hi);color:var(--dn)}.al.med>b{background:var(--me);color:var(--wn)}.al.low>b{background:var(--lo);color:var(--mu)}.al.info>b{background:var(--in);color:var(--ac)}.al.ok>b{background:var(--okc);color:var(--up)}
.al p{margin:2px 0 0;font-size:13px;color:var(--mu)}.al ul{margin:6px 0 0;padding-left:16px;font-size:12px}.al code{font-size:12px}
button.kpi{font:inherit;color:inherit;text-align:left;cursor:pointer;position:relative}button.kpi:hover,button.kpi[aria-expanded=true]{border-color:var(--ac)}button.kpi i{position:absolute;right:12px;top:10px;font-style:normal;font-size:11px;color:var(--ac)}button.kpi[aria-expanded=true] i::after{content:' (fechar)'}
.panel{background:var(--card);border:1px solid var(--ac);border-radius:10px;padding:12px 14px;margin:-6px 0 16px}.panel h3{margin:0 0 4px;font-size:15px}.panel .tw{border:0}.panel table{min-width:560px}
.bar{display:inline-block;width:72px;height:8px;border-radius:4px;background:var(--ln);vertical-align:middle;margin-right:8px;position:relative;overflow:hidden}.bar::after{content:'';position:absolute;inset:0;width:var(--w);background:var(--ac)}
ul.plain{list-style:none;padding:0;margin:0;display:grid;gap:4px;font-size:14px}ul.plain b{font-size:11px;padding:1px 6px;border-radius:6px;margin-right:6px}ul.plain b.high{background:var(--hi);color:var(--dn)}ul.plain b.med{background:var(--me);color:var(--wn)}
table.sortable thead th:not(.nosort){cursor:pointer;user-select:none}table.sortable thead th:not(.nosort):hover{color:var(--fg)}table.sortable thead th.sorted-desc::after{content:' ↓'}table.sortable thead th.sorted-asc::after{content:' ↑'}
</style></head><body><main>
<h1>Tração dos projetos</h1><p class="foot">Pessoas por dia (UTC). Recolha diária às 05:17 UTC; última: ${run ? esc(run.at.slice(0, 16).replace('T', ' ')) + ' UTC' : 'ainda sem recolha'}.${errs.length ? ` <span class="dn">Fontes com erro: ${esc(errs.join(', '))}</span>` : ''}</p>
<div class="kpis">${kpiCard('landings', L.w, 'pessoas nas landings · 7 dias', pct(L.w, L.wp))}${kpiCard('tools', Tl.w, 'utilizadores das ferramentas · 7 dias', pct(Tl.w, Tl.wp))}${kpiCard('alerts', alerts.filter(a => a.sev === 'high' || a.sev === 'med').length, 'alertas a precisar de olhar', null)}${kpiCard('nosource', Object.keys(SITES).filter(k => !srcOf[k]).length, 'projetos ainda sem fonte ligada', null)}</div>
${panels}
<section id="alertas"><h2>Alertas · últimas 48 h</h2><p class="sub">Comparado com a mediana dos 7 dias anteriores. "Hoje" é um dia parcial, já corrigido pela hora.</p><ol class="alerts">${alertsHtml}</ol></section>
${section('tools', 'Ferramentas e dashboards', 'Quem abriu ou usou: dashboards SOA, ANFT e Tan, SHEQ One e as aplicações.')}
${section('landings', 'Landing pages e sites', 'Visitantes únicos onde há contador próprio; "Web Analytics" é o contador da Cloudflare em browsers reais (amostrado, sem robôs).')}
<section><h2>Páginas mais vistas · ontem</h2><p class="sub">Visitas HTML servidas pela Cloudflare (inclui alguns robôs), comparadas com a média dos 6 dias anteriores dessa página.</p><div class="tw"><table class="sortable"><thead><tr><th>Página</th><th class="sorted-desc">Ontem</th><th>Média 6 d</th><th>Δ</th></tr></thead><tbody>${pagesHtml || '<tr><td colspan="4" class="mu">ainda sem dados</td></tr>'}</tbody></table></div></section>
<section><h2>Saúde dos domínios · 7 dias</h2><p class="sub">Todos os pedidos que chegaram à Cloudflare. Erros 5xx vêm do nosso servidor; 4xx em massa são normalmente scanners.</p><div class="tw"><table class="sortable"><thead><tr><th>Domínio</th><th class="sorted-desc">Pedidos</th><th>4xx</th><th>5xx</th><th>Visitas HTML</th><th>Browsers reais</th></tr></thead><tbody>${infra || '<tr><td colspan="6" class="mu">ainda sem dados</td></tr>'}</tbody></table></div></section>
<p class="foot">Sem cookies nem IPs guardados nesta página. Regras de firewall/WAF não estão acessíveis à API neste plano, por isso os alertas baseiam-se em estados HTTP e caminhos pedidos.</p>
</main><script>
(function(){
  var val=function(c){if(!c)return{n:-Infinity,t:''};var v=c.getAttribute('data-v');return v!==null?{n:parseFloat(v),t:''}:{n:NaN,t:(c.textContent||'').trim().toLowerCase()};};
  document.querySelectorAll('table.sortable').forEach(function(tb){
    var ths=tb.querySelectorAll('thead th');
    ths.forEach(function(th,i){ if(th.classList.contains('nosort'))return;
      th.addEventListener('click',function(){
        var desc=!th.classList.contains('sorted-desc');
        ths.forEach(function(x){x.classList.remove('sorted-desc','sorted-asc');});
        th.classList.add(desc?'sorted-desc':'sorted-asc');
        var body=tb.tBodies[0], rows=Array.prototype.slice.call(body.rows);
        rows.sort(function(a,b){var A=val(a.cells[i]),B=val(b.cells[i]);var r=isNaN(A.n)||isNaN(B.n)?A.t.localeCompare(B.t):A.n-B.n;return desc?-r:r;});
        rows.forEach(function(r){body.appendChild(r);});
      });
    });
  });
  var btns=document.querySelectorAll('button.kpi');
  btns.forEach(function(b){ b.addEventListener('click',function(){
    var id='panel-'+b.getAttribute('data-panel'), open=b.getAttribute('aria-expanded')==='true';
    btns.forEach(function(x){x.setAttribute('aria-expanded','false');});
    document.querySelectorAll('.panel').forEach(function(p){p.hidden=true;});
    if(!open){ b.setAttribute('aria-expanded','true'); var p=document.getElementById(id); p.hidden=false; p.scrollIntoView({block:'nearest',behavior:'smooth'}); }
  });});
})();
</script></body></html>`;
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url), parts = u.pathname.split('/').filter(Boolean);
    const h = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' };
    if (!env.ACCESS_KEY || parts[0] !== env.ACCESS_KEY) return new Response('Not found', { status: 404, headers: h });
    if (parts[1] === 'refresh' && req.method === 'POST') return Response.json({ notes: await collect(env) }, { headers: h });
    if (parts[1]) return new Response('Not found', { status: 404, headers: h });
    return new Response(await page(env), { headers: { ...h, 'content-type': 'text/html; charset=utf-8' } });
  },
  async scheduled(_e, env, ctx) { ctx.waitUntil(collect(env)); },
};
