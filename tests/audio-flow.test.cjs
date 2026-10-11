const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const sounds=require('../sounds.js');

function setup(preferences={}){
  const rendered=[],played=[],nodes=new Map(),frames=new Map();
  let clock=0,nextFrame=0;
  function node(key){
    if(!nodes.has(key)) nodes.set(key,{listeners:{},style:{setProperty(){}},classList:{toggle(){}},dataset:{},addEventListener(event,fn){this.listeners[event]=fn;},setAttribute(){},focus(){},getAttribute(){return null;}});
    return nodes.get(key);
  }
  const controlKeys=['masterVolume','effectsVolume','textVolume','effectsEnabled','textSound'];
  const controls=controlKeys.map(key=>Object.assign(node(key),{dataset:{setting:key},type:key==='effectsEnabled'?'checkbox':key==='textSound'?'select-one':'range',min:'0',max:'100'}));
  const replay=node('replay'),dialog=node('dialog'),panel=node('panel');
  dialog.open=true;panel.hidden=false;
  dialog.querySelector=selector=>selector==='[data-replay-preview]'?replay:selector==='[data-setting="effectsVolume"]'?node('effectsVolume'):node(selector);
  dialog.querySelectorAll=selector=>selector==='[data-setting]'?controls:[];
  const document={body:node('body'),documentElement:node('root'),querySelector:selector=>selector==='#settings-dialog'?dialog:selector==='#settings-dialogue'?panel:node(selector),querySelectorAll:()=>[],addEventListener(){}};
  class AudioContext{
    constructor(){this.state='running';this.currentTime=0;this.destination={};}
    createBuffer(channels,length,rate){assert.equal(channels,1);assert.ok(length>0);assert.equal(rate,sounds.sampleRate);return {copyToChannel(data){assert.equal(data.length,length);}};}
    createBufferSource(){return {connect(){},disconnect(){},start(){played.push(this);},stop(){this.stopped=true;}};}
    createGain(){return {gain:{value:0,setValueAtTime(value){this.value=value;},cancelScheduledValues(){},linearRampToValueAtTime(value){this.value=value;}},connect(){},disconnect(){}};}
  }
  const window={AudioContext,PixelySounds:{...sounds,render(...args){rendered.push(args);return sounds.render(...args);}}};
  const sandbox={window,document,localStorage:{getItem:()=>JSON.stringify({textSound:'soft',...preferences}),setItem(){}},CustomEvent:class{},dispatchEvent(){},performance:{now:()=>clock},requestAnimationFrame:fn=>{const id=++nextFrame;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};
  vm.runInNewContext(fs.readFileSync(require.resolve('../settings.js'),'utf8'),sandbox);
  function frame(time){clock=time;const queued=[...frames.values()];frames.clear();queued.forEach(fn=>fn(time));}
  return {api:window.PixelySettings,rendered,played,controls,node,replay,dialog,frame,frames};
}

test('actual playback routes each object and the switch mutes all effects without muting voice',async()=>{
  const app=setup();
  assert.equal(await app.api.playEffect('house'),true);
  assert.equal(await app.api.playEffect('bush'),true);
  assert.deepEqual(app.rendered.map(args=>args.slice(0,2)),[['wood','house'],['rustle','bush']]);
  const before=app.played.length;
  await app.api.playEffect('menu');
  assert.equal(app.played.length,before,'buttons are silent even with effects on');
  const toggle=app.node('effectsEnabled');toggle.checked=false;toggle.listeners.change();
  assert.equal(await app.api.playEffect('house'),false);
  assert.equal(await app.api.playEffect('bush'),false);
  assert.equal(await app.api.playEffect('menu'),false);
  assert.equal(app.played.length,2);assert.equal(app.api.getVolume('effects'),0);
  assert.ok(app.api.getVolume('text')>0);
});

test('dialogue preview plays short selected syllables as text appears and stops on close',()=>{
  const app=setup();app.replay.listeners.click();
  for(const time of [35,70,120,180,240,300,360]) app.frame(time);
  assert.ok(app.rendered.length>=3&&app.rendered.length<=5);
  assert.ok(app.rendered.every(([kind,target,index])=>kind==='soft'&&target===''&&Number.isInteger(index)));
  assert.equal(app.node('.dialogue-preview-text').textContent,'초대는 받았고, 귀가는');
  const count=app.played.length;app.dialog.listeners.close();app.frame(450);
  assert.equal(app.played.length,count);assert.equal(app.frames.size,0);assert.equal(app.played.at(-1).stopped,true);
});

test('unselected, muted, and instantly displayed dialogue remain silent',()=>{
  for(const preferences of [{textSound:'none'},{textVolume:0},{masterVolume:0},{textSpeed:0}]){
    const app=setup(preferences);app.replay.listeners.click();app.frame(100);app.frame(200);
    assert.equal(app.played.length,0);
  }
});
