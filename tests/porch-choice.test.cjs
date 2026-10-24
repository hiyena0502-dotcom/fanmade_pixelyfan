'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../game-data.js'),M=require('../game-model.js'),Sound=require('../sounds.js'),Settings=require('../settings.js');
function inspect(){const data=M.content(D.defaults()),state=M.create(data,0);assert.ok(M.move(state,data,'porch'));const door=M.scene(state,data).objects.find(o=>o.id==='porch-door');assert.ok(M.investigate(state,data,door));return {data,state,door};}
test('investigating the close-up door immediately presents the exact question and two choices',()=>{
 const {state,data,door}=inspect(),step=M.current(state);assert.equal(door.kind,'inspect');assert.equal(step.type,'choice');assert.equal(step.prompt,'노크를 할까?');assert.deepEqual(step.options.map(o=>o.text),['주변을 더 둘러본다','노크한다']);assert.equal(data.locations.find(l=>l.id==='front').objects.find(o=>o.id==='front-door').kind,'move');assert.deepEqual(state.inventory,{});
});
test('looking around closes the choices and allows returning to the garden or inspecting again',()=>{
 const {state,data,door}=inspect();assert.ok(M.choose(state,0));assert.equal(state.run,null);assert.equal(state.location,'porch');assert.equal(state.flags['porch-knocked'],undefined);assert.ok(M.move(state,data,'front'));assert.ok(M.move(state,data,'porch'));assert.ok(M.investigate(state,data,door));assert.equal(M.current(state).prompt,'노크를 할까?');
});
test('knocking plays its own sound and records the action without adding a scene or dialogue',()=>{
 const {state,data}=inspect(),visits=structuredClone(state.visits);assert.ok(M.choose(state,1));assert.deepEqual(M.current(state),{type:'sfx',id:'door-knock'});M.next(state);assert.equal(M.current(state).type,'wait');assert.equal(state.flags['porch-knocked'],undefined);M.next(state);M.apply(state,data,M.current(state));M.next(state);assert.equal(state.run,null);assert.equal(state.flags['porch-knocked'],true);assert.equal(state.location,'porch');assert.deepEqual(state.visits,visits);assert.deepEqual(state.inventory,{});
});
test('the pending question survives saving and loading, with both branches still usable',()=>{
 const {state,data}=inspect();for(const option of [0,1]){const restored=M.restore(structuredClone(state),data);assert.equal(M.current(restored).prompt,'노크를 할까?');assert.ok(M.choose(restored,option));assert.equal(restored.location,'porch');assert.equal(restored.choices['porch-knock'],option);}
});
test('existing outdoor content gets the door once and later authored changes remain intact',()=>{
 const old=M.content(D.defaults());delete old.porchInteractionVersion;old.locations.find(l=>l.id==='porch').objects=[];delete old.events['porch-door-choice'];const before=structuredClone(old),updated=D.migrate(old);assert.deepEqual(old,before);assert.deepEqual(updated.monologue,old.monologue);assert.deepEqual(updated.events.opening,old.events.opening);assert.equal(updated.locations.find(l=>l.id==='porch').objects.length,1);assert.deepEqual(D.migrate(updated),updated);updated.events['porch-door-choice'][0].prompt='직접 수정한 질문';updated.locations.find(l=>l.id==='porch').objects[0].rect.x=39;assert.deepEqual(D.migrate(updated),updated);
 const saved=M.create(old,4);saved.location='porch';saved.playMs=123456;saved.readLines.original=true;const restored=M.restore(saved,M.content(updated));assert.equal(restored.location,'porch');assert.equal(restored.playMs,123456);assert.equal(restored.readLines.original,true);
});
test('choice questions validate while existing choices without a question stay supported',()=>{
 const data=D.defaults();for(const prompt of ['',12,'x'.repeat(301)]){const raw=structuredClone(data);raw.events['porch-door-choice'][0].prompt=prompt;assert.throws(()=>M.content(raw));}const raw=structuredClone(data);delete raw.events['porch-door-choice'][0].prompt;assert.ok(M.content(raw));
});
test('the original knock has two separated wooden attacks and respects effect mute policy',()=>{
 assert.equal(Sound.effectKind('door-knock'),'knock');const samples=Sound.render('knock');let peak=0,jump=0;for(let i=0;i<samples.length;i++){assert.ok(Number.isFinite(samples[i]));peak=Math.max(peak,Math.abs(samples[i]));if(i)jump=Math.max(jump,Math.abs(samples[i]-samples[i-1]));}assert.ok(peak>.1&&peak<.5);assert.ok(jump<.2);assert.equal(samples[0],0);assert.equal(samples.at(-1),0);const energy=(from,to)=>samples.slice(Math.floor(from*Sound.sampleRate),Math.floor(to*Sound.sampleRate)).reduce((sum,n)=>sum+n*n,0);assert.ok(energy(.015,.195)>1);assert.ok(energy(.245,.425)>1);assert.equal(energy(.195,.24),0);assert.equal(Settings.volume({...Settings.DEFAULTS,effectsEnabled:false},'effects'),0);
});
