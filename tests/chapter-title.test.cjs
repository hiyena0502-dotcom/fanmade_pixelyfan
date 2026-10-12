'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../chapter-title.js'),M=require('../game-model.js'),D=require('../game-data.js'),P=require('../monologue-model.js'),S=require('../sounds.js'),Settings=require('../settings.js');
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
