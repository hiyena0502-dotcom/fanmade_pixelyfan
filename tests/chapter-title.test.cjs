'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../chapter-title.js'),M=require('../game-model.js'),D=require('../game-data.js'),P=require('../monologue-model.js'),S=require('../sounds.js'),Settings=require('../settings.js');
test('chapter wings, orbit and sparkle motions stay enabled and seekable with motion preferences off',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),runs=[],classes=new Set();
 const element=()=>({style:{},dataset:{},classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},setAttribute(){},append(){},remove(){this.removed=true;},getTotalLength:()=>100,
  animate(frames,options){const a={frames,options,currentTime:0,pause(){this.paused=true;},cancel(){this.cancelled=true;}};runs.push(a);return a;}});
 const document={documentElement:element(),createElement(){const n=element(),nodes={};n.querySelector=s=>nodes[s]||=element();n.querySelectorAll=s=>s==='.ct-feather'?[{...element(),dataset:{feather:'8',wingFeather:'1'}},{...element(),dataset:{feather:'0',wingFeather:'1'}},{...element(),dataset:{feather:'footer-l'}}]:[n.querySelector(s)];return n;}};
 const box={module:{exports:{}},document,structuredClone};vm.runInNewContext(fs.readFileSync(require.resolve('../chapter-title.js'),'utf8'),box);
 const title=box.module.exports.create(element());title.mount({number:0,title:'초대'},{motion:false});
 assert.ok(runs.filter(a=>a.frames.some(f=>f.transform?.includes('rotate'))).length>=3,'both wings and circle unfold');
 assert.ok(runs.some(a=>a.options.iterations===2&&a.frames.some(f=>f.transform?.includes('scale'))),'sparkles still pulse');
 assert.ok(runs.some(a=>a.options.delay===C.soundStart&&a.options.duration===280&&a.frames.some(f=>f.transform==='scale(1.13)')),'title settles on the second strike');
 const feathers=runs.filter(a=>a.frames.some(f=>f.transform==='rotate(18deg) scale(.18,.46)'));assert.equal(feathers.length,2);assert.ok(feathers[0].options.delay<feathers[1].options.delay,'lower feathers unfold before the upper feathers');assert.ok(feathers.every(a=>a.options.delay+a.options.duration<=1600),'wings settle for the reading interval');
 assert.ok(runs.every(a=>a.paused));title.seek(2321);assert.ok(runs.every(a=>a.currentTime===2321));title.seek(9000);assert.ok(runs.every(a=>a.currentTime===C.duration));
 const root=title.element;title.hide();assert.ok(runs.every(a=>a.cancelled));assert.ok(root.removed);assert.equal(title.element,null);assert.equal(classes.size,0);
});
test('prologue title is inserted after monologue without changing original events or preview',()=>{
 const d=M.content(D.defaults()),original=P.opening(d),copy=structuredClone(original),steps=C.opening(original);
 assert.deepEqual(original,copy);assert.equal(steps[0].type,'monologue');assert.deepEqual(steps[1],{type:'chapter-title',number:0,title:'초대'});assert.deepEqual(steps.slice(2),original.slice(1));assert.deepEqual(P.opening(d,0,true),[{type:'monologue',page:0}]);
 d.monologue.enabled=false;assert.equal(C.opening(P.opening(d))[0].type,'chapter-title');assert.deepEqual(C.opening(steps),steps);
});
test('chapter numbers use Roman numerals and no extra English subtitle',()=>{
 for(const [n,label] of [[0,'PROLOGUE 0'],[1,'CHAPTER I'],[2,'CHAPTER II'],[3,'CHAPTER III'],[14,'CHAPTER XIV']])assert.equal(C.label(n),label);
 for(const n of [-1,1.2,4000,Infinity])assert.throws(()=>C.label(n));assert.ok(!C.ornament().includes('Invitation'));
});
test('the selected two-hit recording starts once, resume does not repeat it, exit is 4.8 seconds',()=>{
 let elapsed=0,heard=[];while(elapsed<C.duration){const next=Math.min(C.duration,elapsed+17);heard.push(...C.crossed(elapsed,next).map(h=>h.id));elapsed=next;}
 assert.deepEqual(heard,['chapter-opening']);assert.deepEqual(C.crossed(1500,4800),[]);assert.equal(C.hits[0].at,1120);assert.equal(C.titleSettle-C.soundStart,280);assert.equal(C.duration,4800);
});
test('saved cinematic elapsed time is bounded and future chapter data validates',()=>{
 const d=M.content(D.defaults()),s=M.create(d,0);s.run={id:'prologue-opening',steps:C.opening(P.opening(d)),index:1,presentation:{index:1,elapsed:2321}};
 assert.equal(M.restore(s,d).run.presentation.elapsed,2321);s.run.presentation.elapsed=9000;assert.equal(M.restore(s,d).run.presentation.elapsed,4800);
 for(const step of [{type:'chapter-title',number:-1,title:'초대'},{type:'chapter-title',number:1,title:''}])assert.throws(()=>M.content({...d,events:{bad:[step]}}));
 assert.equal(M.content({...d,events:{...d.events,next:[{type:'chapter-title',number:2,title:'다음 이야기'}]}}).events.next[0].number,2);
});
test('original drum synthesis is finite, warm, fades cleanly and obeys effect volume policy',()=>{
 for(const id of ['chapter-first','chapter-second']){const samples=S.render(S.effectKind(id));let peak=0,energy=0,jump=0;samples.forEach((v,i)=>{assert.ok(Number.isFinite(v));peak=Math.max(peak,Math.abs(v));energy+=v*v;if(i)jump=Math.max(jump,Math.abs(v-samples[i-1]));});assert.ok(peak>.1&&peak<.8);assert.ok(energy>1);assert.ok(jump<.1);assert.equal(samples[0],0);assert.equal(samples.at(-1),0);}
 assert.ok(S.render('chapter-second').length>S.render('chapter-first').length*5);assert.equal(Settings.volume({...Settings.DEFAULTS,effectsEnabled:false},'effects'),0);assert.equal(Settings.volume({...Settings.DEFAULTS,masterVolume:0},'effects'),0);assert.equal(Settings.volume({...Settings.DEFAULTS,effectsVolume:0},'effects'),0);
});
