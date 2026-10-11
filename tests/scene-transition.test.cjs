const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../scene-transition.js');
test('scene images are ready before switching and duplicate URLs load once',async()=>{
 const pending=[],seen=[];
 class Image{set src(value){seen.push(value);pending.push(this);}decode(){return Promise.resolve();}}
 const loader=create(Image);let ready=false;
 const task=loader.prepare(['garden','actor','garden','']).then(()=>ready=true);
 assert.deepEqual(seen,['garden','actor']);assert.equal(ready,false);
 pending[0].onload();await Promise.resolve();assert.equal(ready,false);
 pending[1].onload();await task;assert.equal(ready,true);
 await loader.prepare(['garden']);assert.equal(seen.length,2);
});
test('failed images do not become permanently cached; a later attempt can recover',async()=>{
 const pending=[];class Image{set src(value){pending.push(this);}}
 const loader=create(Image),task=loader.prepare(['missing']);pending[0].onerror();
 await assert.rejects(task,/불러오지 못했어요/);
 const retry=loader.prepare(['missing']);assert.equal(pending.length,2);pending[1].onload();await retry;
});
