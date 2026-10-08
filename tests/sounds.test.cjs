const test=require('node:test');
const assert=require('node:assert/strict');
const {render,sampleRate,effectKind}=require('../sounds.js');

test('every sound is finite, unclipped, audible, and fades without a hard edge',()=>{
  const variants=[...['paper','wood','pop','soft','pixel','bubble'].map(kind=>[kind,'']),...['paper','wood','pop'].flatMap(kind=>['house','bush'].map(target=>[kind,target]))];
  for(const [kind,target] of variants){
    const samples=render(kind,target);
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

test('house and bush clicks request their own effects even when motion is disabled',()=>{
  const vm=require('node:vm'),fs=require('node:fs');
  const heard=[],animated=[];
  let motion=false;
  function element(name){return {addEventListener:(event,handler)=>{handlers[name]=handler;},animate:()=>{animated.push(name);return {cancel(){}};}};}
  const handlers={},nodes={'.layer-house':element('house'),'.house-touch':element('houseClick'),'.door-sign':element('sign'),'.bush-art':element('bush'),'.bush-touch':element('bushClick'),'.bush-leaves':{querySelectorAll:()=>[],replaceChildren(){}}};
  const sandbox={document:{querySelector:selector=>nodes[selector]??null,querySelectorAll:()=>[]},window:{PixelySettings:{get:()=>({motion}),playEffect:target=>heard.push(target)}},matchMedia:()=>({matches:false}),addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../app.js'),'utf8'),sandbox);
  handlers.houseClick();handlers.bushClick();
  assert.deepEqual(heard,['house','bush']);assert.deepEqual(animated,[]);
  motion=true;handlers.houseClick();
  assert.deepEqual(heard,['house','bush','house']);assert.deepEqual(animated,['house','sign']);
});

test('each interactive object has a distinct fixed effect',()=>{
  assert.equal(effectKind('house'),'wood');
  assert.equal(effectKind('bush'),'paper');
  assert.equal(effectKind('menu'),'pop');
  assert.equal(effectKind('unknown'),'none');
  assert.notDeepEqual(render(effectKind('house'),'house'),render(effectKind('bush'),'bush'));
});
