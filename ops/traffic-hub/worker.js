// traffic-hub: one private page with human-traffic tractions across all projects.
// Daily cron copies aggregated counts from each project's own counter into DB.daily.
// Secrets: ACCESS_KEY (secret URL segment), CF_TOKEN (Analytics+Zone read), UMAMI_USER, UMAMI_PASS.
const BACKFILL_DAYS = 14;
const UMAMI = { url: 'https://analytics.paginasemetaforas.pt', site: '876a846b-d38c-4a75-948c-512442623667' };

// group: tools = people using our tools/dashboards; landings = people visiting public pages.
// q: 'uniq' = real distinct visitors from a first-party JS counter; 'views' = page views from a first-party counter;
// 'edge' = Cloudflare edge request estimate (no JS, includes some automated traffic).
export const SITES = {
  soa:        { label: 'Dashboard SOA',            group: 'tools' },
  anft:       { label: 'Dashboard ANFT',           group: 'tools' },
  ler:        { label: 'Lê Comigo (ferramenta)',   group: 'tools' },
  foco:       { label: 'Foco (ferramenta)',        group: 'tools' },
  saldo_app:  { label: 'Saldo (app)',              group: 'tools' },
  leadshortcut:{label: 'LeadShortcut',             group: 'landings' },
  pam:        { label: 'paginasemetaforas.pt',     group: 'landings' },
  mindwink:   { label: 'Mindwink',                 group: 'landings' },
  foco_lp:    { label: 'Foco (landing)',           group: 'landings' },
  ler_lp:     { label: 'Lê Comigo (landing)',      group: 'landings' },
  saldo_lp:   { label: 'Saldo (landing)',          group: 'landings' },
  parenting:  { label: 'Parenting (5 idiomas)',    group: 'landings' },
  parentclasses_go: { label: 'ParentClasses (links go.)', group: 'landings' },
  parentclasses_plano: { label: 'ParentClasses plano',    group: 'landings' },
  playandmusic:{label: 'playandmusic.pt',          group: 'landings' },
  'gymboreeclasses.pt': { label: 'gymboreeclasses.pt',    group: 'landings' },
  'playlabacademy.com': { label: 'playlabacademy.com',    group: 'landings' },
  'letsprout.co':       { label: 'letsprout.co',          group: 'landings' },
  'ja-automoveis.pt':   { label: 'ja-automoveis.pt',      group: 'landings' },
  'atlanticacascais.com': { label: 'atlanticacascais.com', group: 'landings' },
  'atlanticasurf.com':    { label: 'atlanticasurf.com',    group: 'landings' },
  'atlanticasurfpark.com':{ label: 'atlanticasurfpark.com',group: 'landings' },
  'atlanticawave.com':    { label: 'atlanticawave.com',    group: 'landings' },
  'atlanticawavepool.com':{ label: 'atlanticawavepool.com',group: 'landings' },
  'obidossurferscove.com':{ label: 'obidossurferscove.com',group: 'landings' },
  'obidossurferscove.pt': { label: 'obidossurferscove.pt', group: 'landings' },
  'obidossurfpark.com':   { label: 'obidossurfpark.com',   group: 'landings' },
  'wavegardencascais.com':{ label: 'wavegardencascais.com',group: 'landings' },
  'wavegardenlisboa.com': { label: 'wavegardenlisboa.com', group: 'landings' },
  'wavegardenportugal.com':{label: 'wavegardenportugal.com',group:'landings' },
  'wavepoolportugal.com': { label: 'wavepoolportugal.com', group: 'landings' },
};
const PUB_MAP = { mindwink: 'mindwink', foco: 'foco_lp', ler: 'ler_lp', saldo: 'saldo_lp', parenting: 'parenting' };
// hosts counted by a first-party counter or that are noise: skipped on the edge path
const EDGE_SKIP = new Set(['cognixhub.com','www.cognixhub.com','go.cognixhub.com','metrics.cognixhub.com','mindwink.cognixhub.com','foco.cognixhub.com','ler.cognixhub.com','folga.cognixhub.com','saldo.cognixhub.com','parentalidade.cognixhub.com','parenting.cognixhub.com','parentalite.cognixhub.com','paternidad.cognixhub.com','elternsein.cognixhub.com','get.parentclasses.org','go.leadshortcut.com','traffic.cognixhub.com']);
const EDGE_MAP = { 'soa.cognixhub.com': 'soa', 'anft.cognixhub.com': 'anft', 'plano.parentclasses.org': 'parentclasses_plano' };

const iso = (d) => d.toISOString().slice(0, 10);
const since = () => iso(new Date(Date.now() - BACKFILL_DAYS * 864e5));

async function put(env, rows) {
  if (!rows.length) return;
  const st = env.DB.prepare('INSERT INTO daily(day,site,source,visitors,views) VALUES(?,?,?,?,?) ON CONFLICT(day,site,source) DO UPDATE SET visitors=excluded.visitors, views=excluded.views');
  for (let i = 0; i < rows.length; i += 50) await env.DB.batch(rows.slice(i, i + 50).map(r => st.bind(r.day, r.site, r.source, r.visitors, r.views)));
}
const all = async (db, sql, ...p) => (await db.prepare(sql).bind(...p).all()).results;

const collectors = {
  async pub(env, s) {
    const r = await all(env.PUB, "SELECT day, project, total FROM daily_counts WHERE event='view' AND day>=?", s);
    return r.filter(x => PUB_MAP[x.project]).map(x => ({ day: x.day, site: PUB_MAP[x.project], source: 'uniq-js', visitors: x.total, views: x.total }));
  },
  async ler(env, s) {
    const r = await all(env.LER, "SELECT substr(occurred_at,1,10) day, COUNT(DISTINCT visitor_id) v, COUNT(*) n FROM analytics_events WHERE event_type='page_view' AND visitor_id NOT IN (SELECT visitor_id FROM excluded_visitors) AND substr(occurred_at,1,10)>=? GROUP BY day", s);
    return r.map(x => ({ day: x.day, site: 'ler', source: 'uniq-js', visitors: x.v, views: x.n }));
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
  async edge(env, s) {
    if (!env.CF_TOKEN) return [];
    const H = { authorization: 'Bearer ' + env.CF_TOKEN, 'content-type': 'application/json' };
    const zones = [];
    for (let p = 1; ; p++) {
      const j = await (await fetch(`https://api.cloudflare.com/client/v4/zones?per_page=50&page=${p}`, { headers: H })).json();
      zones.push(...(j.result || []));
      if (p >= (j.result_info?.total_pages || 1)) break;
    }
    const q = `query($z:String!,$a:Date!){viewer{zones(filter:{zoneTag:$z}){httpRequestsAdaptiveGroups(limit:5000,filter:{date_geq:$a,requestSource:"eyeball",edgeResponseStatus:200,edgeResponseContentTypeName:"html"}){dimensions{date clientRequestHTTPHost} count sum{visits}}}}}`;
    const acc = {};
    for (const z of zones) {
      const r = await (await fetch('https://api.cloudflare.com/client/v4/graphql', { method: 'POST', headers: H, body: JSON.stringify({ query: q, variables: { z: z.id, a: s } }) })).json();
      for (const g of r.data?.viewer?.zones?.[0]?.httpRequestsAdaptiveGroups || []) {
        const host = g.dimensions.clientRequestHTTPHost.replace(/:\d+$/, '').replace(/^www\./, '');
        if (EDGE_SKIP.has(host)) continue;
        let site = EDGE_MAP[host] || (host === z.name ? z.name : null);
        if (!site && host.endsWith('.' + z.name)) site = z.name; // other subdomains roll up to the zone
        if (!site || !SITES[site]) continue;
        const k = g.dimensions.date + '|' + site;
        const o = (acc[k] ||= { day: g.dimensions.date, site, source: 'edge-est', visitors: 0, views: 0 });
        o.visitors += g.sum.visits; o.views += g.count;
      }
    }
    return Object.values(acc);
  },
};

export async function collect(env) {
  const s = since(), notes = [];
  for (const [name, fn] of Object.entries(collectors)) {
    try { const rows = await fn(env, s); await put(env, rows); notes.push(`${name}:${rows.length}`); }
    catch (e) { notes.push(`${name}:ERR ${String(e.message || e).slice(0, 80)}`); }
  }
  await env.DB.prepare('INSERT OR REPLACE INTO runs(at,ok,note) VALUES(?,?,?)').bind(new Date().toISOString(), notes.some(n => n.includes('ERR')) ? 0 : 1, notes.join(' ')).run();
  return notes;
}

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => new Intl.NumberFormat('pt-PT').format(Math.round(n));
// If a site has several sources on one day, prefer first-party JS over edge estimates.
const RANK = { 'uniq-js': 0, 'views-js': 1, 'clicks-nobot': 2, 'edge-est': 3 };

async function page(env, base) {
  const from = iso(new Date(Date.now() - 59 * 864e5));
  const rows = await all(env.DB, 'SELECT day,site,source,visitors,views FROM daily WHERE day>=?', from);
  const run = (await all(env.DB, 'SELECT at,ok,note FROM runs ORDER BY at DESC LIMIT 1'))[0];
  const best = {}; // site|day -> row
  for (const r of rows) { const k = r.site + '|' + r.day, c = best[k]; if (!c || (RANK[r.source] ?? 9) < (RANK[c.source] ?? 9)) best[k] = r; }
  const days = [...Array(30)].map((_, i) => iso(new Date(Date.now() - (29 - i) * 864e5)));
  const sum = (site, a, b) => { let t = 0; for (let i = a; i < b; i++) t += best[site + '|' + days[i]]?.visitors || 0; return t; };
  const sumPrev = (site) => { let t = 0; for (let i = 0; i < 30; i++) t += best[site + '|' + iso(new Date(Date.now() - (59 - i) * 864e5))]?.visitors || 0; return t; };
  const kind = (site) => { const srcs = new Set(Object.values(best).filter(r => r.site === site).map(r => r.source)); return srcs.has('uniq-js') ? 'visitantes únicos' : srcs.has('views-js') ? 'visualizações' : srcs.has('clicks-nobot') ? 'cliques humanos' : srcs.has('edge-est') ? 'estimativa (edge)' : '—'; };
  const spark = (site) => {
    const v = days.map(d => best[site + '|' + d]?.visitors || 0), m = Math.max(1, ...v);
    const pts = v.map((x, i) => `${(i * 120 / 29).toFixed(1)},${(26 - x / m * 24).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 120 28" width="120" height="28" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  };
  const section = (group, title, sub) => {
    const list = Object.entries(SITES).filter(([, s]) => s.group === group).map(([id, s]) => ({ id, s, d1: sum(id, 29, 30), d7: sum(id, 23, 30), d30: sum(id, 0, 30), p30: sumPrev(id) })).sort((a, b) => b.d30 - a.d30);
    const tot = (k) => list.reduce((t, x) => t + x[k], 0);
    const body = list.map(x => {
      const delta = x.p30 ? Math.round((x.d30 - x.p30) / x.p30 * 100) : null;
      return `<tr><th scope="row">${esc(x.s.label)}<small>${kind(x.id)}</small></th><td>${fmt(x.d1)}</td><td>${fmt(x.d7)}</td><td>${fmt(x.d30)}</td><td class="${delta == null ? '' : delta >= 0 ? 'up' : 'dn'}">${delta == null ? '—' : (delta >= 0 ? '+' : '') + delta + '%'}</td><td class="sp">${spark(x.id)}</td></tr>`;
    }).join('');
    return `<section><h2>${title}</h2><p class="sub">${sub}</p><div class="tw"><table><thead><tr><th>Projeto</th><th>Ontem</th><th>7 dias</th><th>30 dias</th><th>vs 30d ant.</th><th>30 dias</th></tr></thead><tbody>${body}</tbody><tfoot><tr><th>Total</th><td>${fmt(tot('d1'))}</td><td>${fmt(tot('d7'))}</td><td>${fmt(tot('d30'))}</td><td></td><td></td></tr></tfoot></table></div></section>`;
  };
  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Tração</title><style>
:root{--bg:#f6f5f1;--fg:#1b1b1a;--mu:#6b6a65;--card:#fff;--ln:#e4e2db;--up:#1d7a46;--dn:#b3402a;--ac:#1f4f8f}
@media(prefers-color-scheme:dark){:root{--bg:#141413;--fg:#ecebe6;--mu:#9b9a93;--card:#1d1d1b;--ln:#2e2e2b;--up:#5fc88d;--dn:#ee8a73;--ac:#7fb0ee}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.45 system-ui,sans-serif}
main{max-width:980px;margin:0 auto;padding:24px 16px 48px}h1{font-size:22px;margin:0 0 4px}h2{font-size:17px;margin:32px 0 2px}
.sub,.foot{color:var(--mu);font-size:13px;margin:0 0 10px}.tw{overflow-x:auto;background:var(--card);border:1px solid var(--ln);border-radius:10px}
table{border-collapse:collapse;width:100%;min-width:640px}th,td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--ln);white-space:nowrap}
th:first-child,td:first-child{text-align:left}thead th{font-size:12px;color:var(--mu);font-weight:600}tbody th{font-weight:600}
th small{display:block;font-weight:400;color:var(--mu);font-size:12px}tfoot th,tfoot td{font-weight:700;border-bottom:0}
.up{color:var(--up)}.dn{color:var(--dn)}.sp{color:var(--ac);text-align:left}tr:last-child td,tr:last-child th{border-bottom:0}
</style></head><body><main><h1>Tração dos projetos</h1><p class="foot">Pessoas por dia (UTC). Atualizado ${run ? esc(run.at.slice(0, 16).replace('T', ' ')) + ' UTC' : 'ainda sem recolha'}${run && !run.ok ? ' — com avisos' : ''}.</p>
${section('tools', 'Ferramentas e dashboards', 'Quem usou: dashboards SOA e ANFT (acessos com chave) e as aplicações.')}
${section('landings', 'Landing pages e sites', 'Visitantes únicos onde há contador próprio; "estimativa (edge)" conta pedidos HTML na Cloudflare e pode incluir tráfego automático.')}
<p class="foot">Sem cookies nem IPs guardados nesta página. ${run ? esc(run.note) : ''}</p></main></body></html>`;
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
