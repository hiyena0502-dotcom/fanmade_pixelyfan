/* A narrow DOM harness for the real controllers; no mocked story transitions. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
class Element{
  constructor(tag,doc){this.tagName=tag.toUpperCase();this.doc=doc;this.children=[];this.parentElement=null;this.attributes={};this.dataset=new Proxy({}, {set:(obj,k,v)=>{obj[k]=v;this.attributes['data-'+k.replace(/[A-Z]/g,x=>'-'+x.toLowerCase())]=String(v);return true}});this.listeners={};this.hidden=false;this.inert=false;this.disabled=false;this.naturalWidth=0;this.style={setProperty(k,v){this[k]=v}};this.offsetWidth=1600;this._text='';this._classes=new Set();this.classList={add:(...x)=>x.forEach(c=>this._classes.add(c)),remove:(...x)=>x.forEach(c=>this._classes.delete(c)),contains:c=>this._classes.has(c),toggle:(c,on)=>{if(on===undefined)on=!this._classes.has(c);on?this._classes.add(c):this._classes.delete(c)}}}
  set className(v){this._classes=new Set(v.split(/\s+/).filter(Boolean))}get className(){return [...this._classes].join(' ')}
  set id(v){this.attributes.id=v}get id(){return this.attributes.id||''}
  set src(v){this.attributes.src=v}get src(){return this.attributes.src||''}
  get childElementCount(){return this.children.length}
  set textContent(v){this._text=String(v);this.children=[]}get textContent(){return this._text+this.children.map(n=>n.textContent).join('')}
  set innerHTML(v){this.replaceChildren();parse(v,this,this.doc)}
  append(...nodes){for(const n of nodes){if(n.tagName==='FRAGMENT'){this.append(...n.children);continue}n.parentElement=this;this.children.push(n)}}
  appendChild(n){this.append(n);return n}
  replaceChildren(...nodes){for(const n of this.children)n.parentElement=null;this.children=[];this._text='';this.append(...nodes)}
  insertBefore(n,b){n.parentElement=this;const i=this.children.indexOf(b);this.children.splice(i<0?this.children.length:i,0,n)}
  remove(){if(this.parentElement){const p=this.parentElement;p.children=p.children.filter(n=>n!==this);this.parentElement=null}}
  setAttribute(k,v){v=String(v);this.attributes[k]=v;if(k==='class')this.className=v;if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=v}
  getAttribute(k){return k==='class'?this.className:this.attributes[k]??null}
  removeAttribute(k){delete this.attributes[k]}
  addEventListener(t,f){(this.listeners[t]??=[]).push(f)}removeEventListener(t,f){this.listeners[t]=(this.listeners[t]||[]).filter(x=>x!==f)}
  focus(){this.doc.activeElement=this}
  click(){if(this.disabled)return;this.focus();const e={target:this,preventDefault(){},currentTarget:this};this.onclick?.(e);for(const f of this.listeners.click||[])f(e)}
  querySelectorAll(q){return select(this,q)}querySelector(q){return this.querySelectorAll(q)[0]||null}
}
function matches(n,q){
  if(q.includes(':not(:disabled)')){if(n.disabled)return false;q=q.replace(':not(:disabled)','')}
  const tag=q.match(/^[a-z][\w-]*/i);if(tag&&n.tagName!==tag[0].toUpperCase())return false;
  const id=q.match(/#([\w-]+)/);if(id&&n.id!==id[1])return false;
  for(const [,c]of q.matchAll(/\.([\w-]+)/g))if(!n._classes.has(c))return false;
  for(const [,key,value]of q.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)){if(n.getAttribute(key)===null)return false;if(value!==undefined&&n.getAttribute(key)!==value)return false}
  return true;
}
function select(root,q){
  const descendants=[];function walk(n){for(const c of n.children){descendants.push(c);walk(c)}}walk(root);
  return descendants.filter(n=>q.split(',').some(s=>{const parts=s.trim().split(/\s+/);if(!matches(n,parts.pop()))return false;let p=n.parentElement;while(parts.length){const prev=parts.pop();while(p&&!matches(p,prev))p=p.parentElement;if(!p)return false;p=p.parentElement}return true}));
}
function parse(html,root,doc){
  let stack=[root];for(const tok of html.match(/<[^>]*>|[^<]+/g)||[]){if(tok.startsWith('<!--')||tok.startsWith('<!'))continue;if(tok.startsWith('</')){if(stack.length>1)stack.pop();continue}if(tok.startsWith('<')){
    const tag=tok.match(/^<([\w-]+)/)?.[1];if(!tag)continue;const n=new Element(tag,doc);for(const m of tok.matchAll(/([\w:-]+)(?:="([^"]*)")?/g)){if(m.index===1)continue;n.setAttribute(m[1],m[2]??'')}stack.at(-1).append(n);if(!/\/>$/.test(tok)&&!['img','input','meta','link','br','hr'].includes(tag))stack.push(n);
  }else stack.at(-1)._text+=tok}
}
function boot(saved=null,{failStorage=false}={}){
  const root=path.join(__dirname,'..'),timers=new Map(),storage=new Map(),listeners={};let nextId=0,now=0;
  if(saved)storage.set('pixely-anniversary-prologue-v1',JSON.stringify(saved));
  const document=new Element('document');document.doc=document;document.activeElement=null;document.createElement=tag=>new Element(tag,document);document.createDocumentFragment=()=>new Element('fragment',document);document.addEventListener=(t,f)=>(listeners[t]??=[]).push(f);
  parse(fs.readFileSync(path.join(root,'index.html'),'utf8'),document,document);document.documentElement=document.querySelector('html');
  const timeout=(fn,delay=0)=>{const id=++nextId;timers.set(id,{fn,time:now+delay});return id};
  const window={addEventListener(){},AudioContext:undefined};const ctx={window,document,Element,HTMLImageElement:class {},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(failStorage)throw Error('full');storage.set(k,v)}},setTimeout:timeout,clearTimeout:id=>timers.delete(id),setInterval:timeout,clearInterval:id=>timers.delete(id),requestAnimationFrame:f=>f(),Date,Math,console};window.setTimeout=timeout;
  vm.createContext(ctx);for(const file of ['member-dialogue.js','prologue-state.js','prologue-data.js','prologue-audio.js','exterior-art.js','prologue.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx,{filename:file});
  function advanceTime(ms){const end=now+ms;let limit=0;while([...timers.values()].some(v=>v.time<=end)){const [id,t]=[...timers].filter(([,v])=>v.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];timers.delete(id);now=t.time;t.fn();if(++limit>1000)throw Error('timer loop')}now=end}
  const getSave=()=>JSON.parse(storage.get('pixely-anniversary-prologue-v1')||'null');
  function click(id){const el=document.querySelector('#'+id);if(!el)throw Error('Missing element '+id);for(let n=el;n;n=n.parentElement)if(n.inert||n.hidden)throw Error('User cannot click hidden/inert '+id);el.click()}
  function drainDialogue(limit=200){let count=0;while(window.PixelyDialogue.isOpen()){
    if(++count>limit)throw Error('stuck dialogue');const choices=document.querySelector('#dialogue-choices');const next=document.querySelector('#dialogue-next');
    if(!choices.hidden){choices.children[0].click()}else if(next.disabled){advanceTime(2500)}else next.click();advanceTime(1000);
  }}
  return {document,window,click,getSave,advanceTime,drainDialogue,storage};
}
module.exports={boot};
