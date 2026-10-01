const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../rebuild.js'),'utf8');
const key='pixely-rebuild-save-v1';

function boot(saved,{failStorage=false}={}){
  const nodes=new Map(),timers=new Map(),documentListeners=new Map();
  let nextTimer=0,now=0;
  const storage=new Map(saved?[[key,JSON.stringify(saved)]]:[]);
  function node(selector){
    if(!nodes.has(selector)){
      const classes=new Set();
      const element={hidden:true,inert:false,dataset:{},children:[],listeners:{},textContent:'',
        className:'',disabled:false,childElementCount:0,clientWidth:1000,offsetLeft:100,offsetTop:500,offsetWidth:120,
        style:{setProperty(){}},
        classList:{add(...values){values.forEach(v=>classes.add(v))},remove(...values){values.forEach(v=>classes.delete(v))},toggle(v,on){on?classes.add(v):classes.delete(v)},contains(v){return classes.has(v)}},
        addEventListener(name,fn){this.listeners[name]=fn},removeEventListener(name){delete this.listeners[name]},
        appendChild(child){this.children.push(child);this.childElementCount++},replaceChildren(){this.children=[]},
        setAttribute(name,value){this[name]=value},focus(){document.activeElement=this},click(){this.listeners.click?.({})},
        querySelectorAll(){
          const selectors=selector==='#story-menu'?['#save-progress','#return-home']:selector==='#door-choice'?['#enter-house','#keep-looking']:[];
          return selectors.map(node);
        }};
      nodes.set(selector,element);
    }
    return nodes.get(selector);
  }
  const screens=['home','story'].map(name=>Object.assign(node('screen:'+name),{dataset:{screen:name},hidden:name!=='home'}));
  const scenes=['exterior','door-closeup','living-room'].map(name=>Object.assign(node('scene:'+name),{dataset:{scene:name},hidden:name!=='exterior'}));
  const inspections=['laundry','birdhouse','garden'].map(name=>Object.assign(node('inspect:'+name),{dataset:{inspect:name},parentElement:node('stage')}));
  const document={
    querySelector(selector){
      if(selector==='[data-scene="living-room"]') return scenes[2];
      return node(selector);
    },
    querySelectorAll(selector){return selector==='[data-screen]'?screens:selector==='[data-scene]'?scenes:selector==='[data-inspect]'?inspections:[]},
    createElement(){return node('created:'+nodes.size)},createDocumentFragment(){return node('fragment')},
    addEventListener(name,fn){if(!documentListeners.has(name)) documentListeners.set(name,new Set());documentListeners.get(name).add(fn)},
    removeEventListener(name,fn){documentListeners.get(name)?.delete(fn)}
  };
  const setTimeout=(fn,delay=0)=>{const id=++nextTimer;timers.set(id,{fn,time:now+delay});return id};
  vm.runInNewContext(source,{document,HTMLImageElement:class{},localStorage:{
    getItem:k=>storage.get(k),setItem:(k,v)=>{if(failStorage) throw Error('unavailable');storage.set(k,v)}
  },window:{setTimeout},setTimeout,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>fn(),Date,Math});
  function flush(){
    let count=0;
    while(timers.size){
      if(++count>100) throw Error('unbounded timers');
      const [id,timer]=[...timers].sort((a,b)=>a[1].time-b[1].time)[0];
      timers.delete(id);now=timer.time;timer.fn();
    }
  }
  return {node,scenes,flush,click:selector=>node(selector).click(),save:()=>JSON.parse(storage.get(key)||'null'),
    start(){node('#new-story').click();for(let i=0;i<6;i++) node('#intro-monologue').click();flush()},
    activeElement:()=>document.activeElement,
    key(event){documentListeners.get('keydown').forEach(fn=>fn(event))},
    escape(){documentListeners.get('keydown').forEach(fn=>fn({key:'Escape'}))}};
}

test('house exploration, two door clicks, cancellation, and resume retain the correct scene',()=>{
  const app=boot();app.start();
  assert.deepEqual(app.scenes.map(s=>s.hidden),[false,true,true]);
  app.click('#door-hotspot');
  assert.deepEqual(app.scenes.map(s=>s.hidden),[true,false,true]);
  assert.equal(app.node('#door-choice').hidden,true);
  app.click('#door-closeup-hotspot');
  assert.equal(app.node('#door-choice').hidden,false);
  app.click('#keep-looking');
  assert.equal(app.node('#door-choice').hidden,true);
  assert.equal(app.scenes[1].hidden,false);
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.scenes[1].hidden,false);
  assert.equal(resumed.node('#door-choice').hidden,true);
  resumed.click('#door-closeup-back');
  assert.equal(resumed.save().scene,'exterior');
});

test('entry finishes the chapter without adding dialogue or a quest',()=>{
  const app=boot();app.start();app.click('#door-hotspot');app.click('#door-closeup-hotspot');app.click('#enter-house');app.flush();
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.scenes[2].inert,false);
  assert.equal(app.node('#chapter-card').hidden,true);
  assert.equal(app.save().chapterIntroSeen,true);
  assert.notEqual(app.save().decorationQuest,'accepted');
  app.click('#diary-button');assert.equal(app.node('#tool-content').children[0].textContent,'아직 적힌 내용이 없다.');
  app.escape();assert.equal(app.node('#tool-sheet').hidden,true);
  app.click('#leave-house');app.click('#door-hotspot');app.click('#door-closeup-hotspot');app.click('#enter-house');app.flush();
  assert.equal(app.node('#chapter-card').hidden,true);
  assert.equal(app.scenes[2].inert,false);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.doesNotMatch(html,/data-inspect=|id="talk-gongryong"|id="story-dialogue-ui"/);
});

test('invalid saves and unavailable storage cannot prevent starting a playable story',()=>{
  const corrupt=boot({scene:'removed-room'});
  assert.equal(corrupt.node('#continue-story').disabled,true);
  corrupt.start();assert.equal(corrupt.scenes[0].hidden,false);
  const blocked=boot(null,{failStorage:true});blocked.start();
  assert.equal(blocked.scenes[0].hidden,false);
  assert.equal(blocked.scenes[0].inert,false);
  assert.equal(blocked.node('#continue-story').disabled,false);
});


test('outside clicks dismiss only the active panel and restore its opener',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true});app.click('#continue-story');
  app.click('#story-menu-button');
  assert.equal(app.node('#story-menu').hidden,false);
  assert.equal(app.node('#panel-backdrop').hidden,false);
  app.click('#panel-backdrop');
  assert.equal(app.node('#story-menu').hidden,true);
  assert.equal(app.node('#panel-backdrop').hidden,true);
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.activeElement(),app.node('#story-menu-button'));
  for(const opener of ['#bag-button','#diary-button']){
    app.click(opener);
    app.click('#tool-content');
    assert.equal(app.node('#tool-sheet').hidden,false);
    app.click('#panel-backdrop');
    assert.equal(app.node('#tool-sheet').hidden,true);
    assert.equal(app.activeElement(),app.node(opener));
  }
  app.click('#leave-house');app.click('#door-hotspot');app.click('#door-closeup-hotspot');
  app.click('#panel-backdrop');
  assert.equal(app.node('#door-choice').hidden,true);
  assert.equal(app.scenes[1].hidden,false);
  assert.equal(app.activeElement(),app.node('#door-closeup-hotspot'));
});

test('panels are mutually exclusive and keyboard users can close a panel without a close button',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true});app.click('#continue-story');
  app.click('#story-menu-button');app.click('#diary-button');
  assert.equal(app.node('#story-menu').hidden,true);
  assert.equal(app.node('#tool-sheet').hidden,false);
  let prevented=false;app.key({key:'Tab',preventDefault(){prevented=true}});
  assert.equal(prevented,true);
  assert.equal(app.activeElement(),app.node('#tool-sheet'));
  app.escape();
  assert.equal(app.node('#panel-backdrop').hidden,true);
  assert.equal(app.activeElement(),app.node('#diary-button'));
});

test('entry waits for image decoding, prevents duplicate entry, and recovers when decoding fails',async()=>{
  const app=boot({scene:'door-closeup'});app.click('#continue-story');
  let rejectDecode,count=0;
  app.node('.living-room-art').decode=()=>{count++;return new Promise((resolve,reject)=>{rejectDecode=reject})};
  app.click('#door-closeup-hotspot');app.click('#enter-house');app.click('#enter-house');
  assert.equal(count,1);
  assert.equal(app.scenes[1].hidden,false);
  assert.equal(app.scenes[1].inert,true);
  rejectDecode(Error('decode unavailable'));
  await new Promise(setImmediate);
  app.flush();
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.scenes[2].inert,false);
  assert.equal(app.save().chapterIntroSeen,true);
});
