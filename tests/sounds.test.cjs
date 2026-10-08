const test=require('node:test');
const assert=require('node:assert/strict');
const {render,sampleRate}=require('../sounds.js');

test('every sound is finite, unclipped, audible, and fades without a hard edge',()=>{
  for(const kind of ['paper','wood','pop','soft','pixel','bubble']){
    const samples=render(kind);
    assert.ok(samples.length>sampleRate*.1&&samples.length<sampleRate*2,kind);
    let peak=0,energy=0,jump=0;
    samples.forEach((value,i)=>{
      assert.ok(Number.isFinite(value),kind);
      peak=Math.max(peak,Math.abs(value));energy+=value*value;
      if(i) jump=Math.max(jump,Math.abs(value-samples[i-1]));
    });
    assert.ok(peak>.04&&peak<.8,`${kind} peak ${peak}`);
    assert.ok(Math.sqrt(energy/samples.length)>.01,`${kind} has audible energy`);
    assert.ok(jump<.2,`${kind} has no discontinuous click`);
    assert.equal(samples[0],0);assert.equal(samples.at(-1),0);
  }
  assert.equal(render('none').length,0);
  assert.equal(render('invalid').length,0);
});
