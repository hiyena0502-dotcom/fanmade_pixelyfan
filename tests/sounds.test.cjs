const test=require('node:test');
const assert=require('node:assert/strict');
const {render,sampleRate,effectKind}=require('../sounds.js');

test('every sound is finite, unclipped, audible, and fades without a hard edge',()=>{
  const variants=[...['wood','soft','pixel','bubble','rustle'].map(kind=>[kind,'']),['wood','house']];
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
  assert.equal(effectKind('bush'),'rustle');
  assert.equal(effectKind('menu'),'none');
  assert.equal(effectKind('unknown'),'none');
  assert.notDeepEqual(render(effectKind('house'),'house'),render(effectKind('bush'),'bush'));
});

test('object sounds are short, quiet single gestures with no second house hit',()=>{
  for(const kind of ['wood','rustle']){
    const samples=render(kind),rms=Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length);
    assert.ok(samples.length<=sampleRate*.5);
    assert.ok(rms>=.015&&rms<=.025);
    assert.ok(Math.max(...samples.map(Math.abs))<=.131);
  }
  const samples=render('wood'),windows=[];
  for(let start=0;start+480<=samples.length;start+=480)windows.push(Math.sqrt(samples.slice(start,start+480).reduce((sum,v)=>sum+v*v,0)/480));
  const peak=windows.indexOf(Math.max(...windows));
  for(let i=peak+2;i<windows.length;i++)assert.ok(windows[i]<=windows[i-1]*1.08,'no second attack after the plop');
});

test('voice syllables keep a stable pitch while voice types remain distinct',()=>{
  function pitch(samples){
    let best=0,period=0;
    for(let lag=55;lag<=100;lag++){
      let xy=0,xx=0,yy=0;
      for(let i=240;i<840;i++){
        const x=samples[i],y=samples[i+lag];xy+=x*y;xx+=x*x;yy+=y*y;
      }
      const correlation=xy/Math.sqrt(xx*yy);
      if(correlation>best){best=correlation;period=lag;}
    }
    return sampleRate/period;
  }
  const averages=[];
  for(const kind of ['soft','pixel','bubble']){
    const pitches=Array.from({length:9},(_,i)=>pitch(render(kind,'',i)));
    assert.ok(Math.max(...pitches)-Math.min(...pitches)<8,`${kind} does not jump between syllables`);
    averages.push(pitches.reduce((a,b)=>a+b)/pitches.length);
  }
  assert.ok(Math.abs(averages[0]-averages[1])>20);
  assert.ok(Math.abs(averages[0]-averages[2])>20);
});
