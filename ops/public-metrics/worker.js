// Stores aggregate counters only: no cookies, IPs, URLs, referrers or visitor IDs.
const projects = {
  'https://mindwink.cognixhub.com':'mindwink',
  'https://foco.cognixhub.com':'foco',
  'https://ler.cognixhub.com':'ler',
  'https://saldo.cognixhub.com':'saldo',
  'https://parentalidade.cognixhub.com':'parenting',
  'https://parenting.cognixhub.com':'parenting',
  'https://parentalite.cognixhub.com':'parenting',
  'https://paternidad.cognixhub.com':'parenting',
  'https://elternsein.cognixhub.com':'parenting'
};
export default {
  async fetch(request, env) {
    const url=new URL(request.url), origin=request.headers.get('Origin');
    const headers={'Cache-Control':'no-store','Content-Type':'text/plain','Vary':'Origin','Referrer-Policy':'no-referrer'};
    if(projects[origin])headers['Access-Control-Allow-Origin']=origin;
    if(url.pathname==='/health'&&request.method==='GET')return new Response('ok',{headers});
    if(url.pathname!=='/v1/count'||!projects[origin])return new Response('Not found',{status:404,headers});
    if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers});
    if(Number(request.headers.get('Content-Length')||0)>160)return new Response('Too large',{status:413,headers});
    try {
      const reader=request.body?.getReader();if(!reader)return new Response('Invalid',{status:400,headers});
      let text='',size=0;const decoder=new TextDecoder();
      while(true){const r=await reader.read();if(r.done)break;size+=r.value.byteLength;if(size>160){await reader.cancel();return new Response('Too large',{status:413,headers});}text+=decoder.decode(r.value,{stream:true});}
      text+=decoder.decode();const data=JSON.parse(text);
      if(Object.keys(data).sort().join(',')!=='event,project'||data.project!==projects[origin]||!['view','entry_click'].includes(data.event))return new Response('Invalid',{status:400,headers});
      const day=new Date().toISOString().slice(0,10);
      await env.DB.prepare('INSERT INTO daily_counts(day,project,event,total) VALUES(?,?,?,1) ON CONFLICT(day,project,event) DO UPDATE SET total=total+1').bind(day,data.project,data.event).run();
      return new Response(null,{status:204,headers});
    }catch{return new Response('Unavailable',{status:503,headers});}
  },
  async scheduled(_event,env){await env.DB.prepare('DELETE FROM daily_counts WHERE day < ?').bind(new Date(Date.now()-400*86400000).toISOString().slice(0,10)).run();}
};
