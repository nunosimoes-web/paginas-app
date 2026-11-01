import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../../public/cognix-marketing.js',import.meta.url),'utf8');
const key='cognixhub.foco.consent.meta-20261031-v1';
function browser({url='https://foco.cognixhub.com/sobre/',consent=null,optout=false,gpc=false,referrer='',enabled='true'}={}){
 const elements=new Map(), network=[], events={}, store=new Map();
 if(consent)store.set(key,JSON.stringify({version:1,pixel:'1679904550232748',at:Date.now(),ads:false,analytics:false,...consent}));if(optout)store.set('cognixhub.foco.statistics-disabled','1');
 class El {constructor(tag){this.tagName=tag;this.dataset={};this.listeners={};this.children=[];this.classList={contains:()=>false};}setAttribute(k,v){this[k]=v;}append(...v){this.children.push(...v);for(const x of v)if(x?.id)elements.set(x.id,x);}appendChild(v){this.append(v);return v;}addEventListener(k,v){this.listeners[k]=v;}showModal(){this.open=true;}close(){this.open=false;}closest(){return null;}}
 const location=new URL(url);location.replace=()=>{};location.reload=()=>{};location.assign=()=>{};
 const document={currentScript:{dataset:{project:'foco',pixel:'1679904550232748',hosts:'foco.cognixhub.com',paths:'/sobre/',enabled,ga:'G-TEST123'}},referrer,documentElement:{lang:'pt-PT'},head:new El('head'),body:new El('body'),getElementById:id=>elements.get(id),createElement:tag=>new El(tag),addEventListener:(k,v)=>events[k]=v};
 const window={addEventListener:(k,v)=>events[k]=v};const ctx={document,location,URL,history:{replaceState:()=>{location.search='';}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},navigator:{globalPrivacyControl:gpc},window,Element:El,fetch:(url,options)=>{network.push({url,...options});return Promise.resolve();}};
 vm.runInNewContext(source,ctx);return{ctx,network,elements,store};
}
let b=browser();assert.equal(b.network.length,1);assert.deepEqual(JSON.parse(b.network[0].body),{project:'foco',event:'view'});assert.equal(b.ctx.window.fbq,undefined);
b=browser({consent:{ads:true}});assert(b.elements.has('cx-meta-sdk'));assert.equal(b.ctx.window.fbq.queue[0][0],'consent');assert.equal(b.ctx.window.fbq.queue[0][1],'grant');assert(!b.ctx.window.fbq.queue.some(a=>a[0]==='consent'&&a[1]==='revoke')); assert.equal(b.ctx.window.fbq.queue.filter(a=>a[0]==='trackSingle').length,1);assert.equal(b.ctx.window.fbq.queue.find(a=>a[0]==='init').length,2);
b=browser({consent:{analytics:true}});assert(!b.elements.has('cx-meta-sdk'));assert(b.elements.has('cx-google-analytics'));
b=browser({consent:{ads:true},gpc:true});assert(!b.elements.has('cx-meta-sdk'));
for(const url of ['https://foco.cognixhub.com/','https://foco.cognixhub.com/sobre/?email=x','https://foco.cognixhub.com/sobre/#private','https://client.test/sobre/']){b=browser({url,consent:{ads:true}});assert.equal(b.network.length,0);assert(!b.elements.has('cx-meta-sdk'));}
b=browser({optout:true});assert.equal(b.network.length,0);
b=browser({enabled:'false',consent:{ads:true}});assert.equal(b.network.length,0);assert(!b.elements.has('cx-meta-sdk'));
b=browser({consent:{ads:true},referrer:'https://foco.cognixhub.com/?secret=private'});assert.equal(b.network.length,1);assert(!b.elements.has('cx-meta-sdk'));
b=browser({consent:{ads:true},url:'https://foco.cognixhub.com/sobre/?utm_source=test'});assert.equal(b.ctx.location.search,'');assert(b.elements.has('cx-meta-sdk'));
b=browser({consent:{ads:true,at:0}});assert(!b.elements.has('cx-meta-sdk'));
b=browser({consent:{ads:true,pixel:'999999999999999'}});assert(!b.elements.has('cx-meta-sdk'));
const workerSource=await readFile(new URL('./worker.js',import.meta.url),'utf8');const worker=(await import('data:text/javascript;base64,'+Buffer.from(workerSource).toString('base64'))).default;
const calls=[];const env={DB:{prepare(sql){return{bind(...args){calls.push({sql,args});return{run:async()=>({})}}}}}};
async function request(body,{origin='https://foco.cognixhub.com',method='POST'}={}){return worker.fetch(new Request('https://metrics.cognixhub.com/v1/count',{method,headers:{Origin:origin},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})}),env);}
assert.equal((await request({project:'foco',event:'view'})).status,204);assert.deepEqual(calls[0].args.slice(1),['foco','view']);assert.equal(calls[0].args.length,3);
assert.equal((await request({project:'foco',event:'view',email:'private'})).status,400);
assert.equal((await request({project:'mindwink',event:'view'})).status,400);
assert.equal((await request({project:'foco',event:'purchase'})).status,400);
assert.equal((await request({project:'foco',event:'view'},{origin:'https://client.test'})).status,404);
assert.equal((await request('',{method:'GET'})).status,405);
assert.equal((await request('a'.repeat(200))).status,413);assert.equal(calls.length,1);
await worker.scheduled({},env);assert.match(calls[1].sql,/DELETE/);assert.equal(calls[1].args.length,1);
console.log('Passed: default counts, consent, GPC, private boundaries, token URLs, opt-out, payload minimisation, origin isolation, aggregation and retention.');
