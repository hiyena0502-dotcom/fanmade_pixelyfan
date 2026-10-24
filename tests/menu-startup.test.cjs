
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function startup(){const calls=new Map(),storage=new Map([['pixely-developer-mode','1']]),window={};const document={querySelectorAll:()=>[],body:{append(){}},createElement:()=>({hidden:false,querySelectorAll:()=>[{},{}]})};vm.runInNewContext(fs.readFileSync(require.resolve('../book-admin.js'),'utf8'),{window,document,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},AbortSignal,dispatchEvent(){},CustomEvent:class{},fetch:url=>new Promise((resolve,reject)=>calls.set(url.split('action=')[1],{resolve:value=>resolve({ok:true,json:async()=>value}),reject}))});return {admin:window.PixelyAdmin,calls};}
test('public content and session begin together; editing stays authenticated',async()=>{const {admin,calls}=startup();assert.deepEqual([...calls.keys()],['session','published']);calls.get('published').resolve({revision:'public-1',catalogue:{}});assert.equal(admin.isEditor(),false);calls.get('session').resolve({authenticated:true,scope:'owner'});await admin.ready;assert.equal(admin.getPublished().revision,'public-1');assert.equal(admin.isEditor(),true);});
test('a session failure cannot prevent public content or enable editing',async()=>{const {admin,calls}=startup();calls.get('session').reject(Error('session unavailable'));calls.get('published').resolve({revision:'public-2'});await admin.ready;assert.equal(admin.getPublished().revision,'public-2');assert.equal(admin.isEditor(),false);assert.equal(admin.getSession().error,'session unavailable');});
test('a content failure keeps authenticated session and reports unavailable content',async()=>{const {admin,calls}=startup();calls.get('session').resolve({authenticated:true,scope:'owner'});calls.get('published').reject(Error('content unavailable'));await admin.ready;assert.equal(admin.getPublished(),null);assert.equal(admin.isEditor(),true);assert.equal(admin.getSession().error,'content unavailable');});

function transitions(){
 const storage=new Map([['pixely-developer-mode','1']]),elements=[],window={};
 let href='https://game.example/game.html?mode=continue&edit=1&ui=older';
 const location={get href(){return href;},set href(value){href=new URL(value,href).href;},replace(value){href=new URL(value,href).href;}};
 function element(){const children=new Map(),destinations=['./chapters.html?edit=1','./collection.html?edit=1','./game.html?edit=1'].map(destination=>({dataset:{destination}}));return {hidden:false,open:false,querySelectorAll(selector){return selector==='[data-destination]'?destinations:[{},{}];},querySelector(selector){if(!children.has(selector))children.set(selector,{});return children.get(selector);},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;}};}
 const document={querySelectorAll:()=>[],body:{append(el){elements.push(el);}},createElement:element};
 vm.runInNewContext(fs.readFileSync(require.resolve('../book-admin.js'),'utf8'),{window,document,location,URL,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},AbortSignal,dispatchEvent(){},CustomEvent:class{},fetch:async url=>({ok:true,json:async()=>url.includes('action=session')?{authenticated:true,scope:'owner'}:{revision:'public-1',catalogue:{}}})});
 return {admin:window.PixelyAdmin,location,storage,elements};
}
test('leaving editing waits for pending edits and preserves continue mode on a fresh UI route',async()=>{
 const {admin,location,storage}=transitions();await admin.ready;
 let flushed=false;admin.beforeLeave(async()=>{await Promise.resolve();flushed=true;});
 await admin.normalView();const url=new URL(location.href);
 assert.equal(flushed,true);assert.equal(admin.isEditor(),false);assert.equal(storage.get('pixely-developer-mode'),'0');
 assert.equal(url.pathname,'/game.html');assert.equal(url.searchParams.get('mode'),'continue');assert.equal(url.searchParams.has('edit'),false);
 assert.notEqual(url.searchParams.get('ui'),'older');assert.ok(url.searchParams.get('ui'));
});
test('opening play editing keeps the selected menu and uses the same UI revision as normal view',async()=>{
 const {admin,location,elements}=transitions();await admin.ready;admin.editorMenu();
 await elements.at(-1).querySelectorAll('[data-destination]')[2].onclick();
 const editor=new URL(location.href);assert.equal(editor.searchParams.get('edit'),'1');assert.equal(editor.searchParams.get('mode'),'continue');assert.notEqual(editor.searchParams.get('ui'),'older');
 await admin.normalView();const normal=new URL(location.href);
 assert.equal(normal.searchParams.get('mode'),'continue');assert.equal(normal.searchParams.get('ui'),editor.searchParams.get('ui'));
});
