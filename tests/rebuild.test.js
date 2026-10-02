const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../rebuild.js'),'utf8');
const dialogueSource=fs.readFileSync(path.join(__dirname,'../member-dialogue.js'),'utf8');
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
        getAttribute(name){return this[name]??null},setAttribute(name,value){this[name]=value},focus(){document.activeElement=this},click(){this.listeners.click?.({})},
        querySelector(sel){return sel==='button'?this.children[0]:node(sel)},
        querySelectorAll(){
          if(selector==='#dialogue-choices') return this.children;
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
  const context={document,HTMLImageElement:class{},localStorage:{
    getItem:k=>storage.get(k),setItem:(k,v)=>{if(failStorage) throw Error('unavailable');storage.set(k,v)}
  },window:{setTimeout},setTimeout,clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>fn(),Date,Math};
  vm.runInNewContext(dialogueSource,context);
  vm.runInNewContext(source,context);
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

test('chapter leads into the full opening, then a chosen reply starts the recorded quest',()=>{
  const app=boot();app.start();app.click('#door-hotspot');app.click('#door-closeup-hotspot');app.click('#enter-house');app.flush();
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.scenes[2].inert,true);
  assert.equal(app.node('#chapter-card').hidden,true);
  assert.equal(app.save().chapterIntroSeen,true);
  assert.equal(app.node('#dialogue-text').textContent,'어, 왔네?');
  assert.notEqual(app.save().decorationQuest,'accepted');
  for(let i=0;i<17;i++) app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-choices').hidden,false);
  assert.equal(app.node('#dialogue-choices').children.length,3);
  app.node('#dialogue-choices').children[2].click();
  assert.equal(app.node('#dialogue-text').textContent,'그렇게 말하면 되게 시킨 것 같잖아!');
  app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-text').textContent,'…집 구경도 하고. 장식도 받고. 얼마나 좋아~');
  assert.notEqual(app.save().decorationQuest,'accepted');
  app.click('#dialogue-next');
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  assert.equal(app.scenes[2].inert,false);
  assert.equal(app.save().openingSeen,true);
  assert.equal(app.save().decorationQuest,'accepted');
  assert.equal(app.save().dialogueProgress,null);
  app.click('#diary-button');assert.equal(app.node('#tool-content').children[0].textContent,'공룡에게 부탁받은 생일 장식 찾기');
  app.escape();assert.equal(app.node('#tool-sheet').hidden,true);
  app.click('#leave-house');app.click('#door-hotspot');app.click('#door-closeup-hotspot');app.click('#enter-house');app.flush();
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  assert.equal(app.scenes[2].inert,false);
  app.click('#talk-gongryong');
  assert.equal(app.node('#dialogue-text').textContent,'어차피 집 좀 둘러볼 거지?');
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
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true});app.click('#continue-story');
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
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true});app.click('#continue-story');
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
  assert.equal(app.scenes[2].inert,true);
  assert.equal(app.save().chapterIntroSeen,true);
  assert.equal(app.node('#dialogue-text').textContent,'어, 왔네?');
});


test('interruptions preserve the main subtitle and resume at the exact line',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true});app.click('#continue-story');
  for(let i=0;i<7;i++) app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-interruption').hidden,false);
  assert.equal(app.node('#dialogue-interruption').dataset.member,'deokgae');
  assert.equal(app.node('#interruption-text').textContent,'야, 정형준!');
  assert.equal(app.node('#dialogue-text').textContent,'요정들은 뭐… 알아서 오겠지.');
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.node('#interruption-text').textContent,'야, 정형준!');
  resumed.click('#interruption-next');
  assert.equal(resumed.node('#dialogue-interruption').hidden,true);
  assert.equal(resumed.node('#dialogue-text').textContent,'왜!');
});

test('each choice response resumes and completes once without revealing fairy locations',()=>{
  for(let choice=0;choice<3;choice++){
    const app=boot({scene:'living-room',chapterIntroSeen:true,dialogueProgress:{phase:'choices',index:0,choice:null}});
    app.click('#continue-story');app.node('#dialogue-choices').children[choice].click();
    const resumed=boot(app.save());resumed.click('#continue-story');
    assert.equal(resumed.save().dialogueProgress.choice,choice);
    resumed.key({code:'Space',key:' ',preventDefault(){}});
    if(choice===1){
      assert.equal(resumed.node('#dialogue-text').textContent,'진짜 당당하다.');
      assert.equal(resumed.node('#dialogue-speaker').textContent,'라더');
      assert.equal(resumed.node('#story-dialogue-ui').dataset.speaker,'rader');
      assert.equal(resumed.node('#dialogue-interruption').hidden,true);
    }
    resumed.click('#dialogue-next');
    assert.equal(resumed.save().decorationQuest,'accepted');
    assert.equal(resumed.save().dialogueProgress,null);
    assert.equal(resumed.node('#story-dialogue-ui').hidden,true);
    resumed.click('#dialogue-next');
    assert.equal(resumed.save().dialogueProgress,null);
    const final=boot(resumed.save());final.click('#continue-story');
    assert.equal(final.node('#story-dialogue-ui').hidden,true);
  }
});

test('invalid dialogue progress restarts safely, and a new story clears the previous quest and branch',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted',dialogueProgress:{phase:'reply',choice:99,index:400}});
  app.click('#continue-story');assert.equal(app.node('#dialogue-text').textContent,'어, 왔네?');
  app.click('#new-story');
  assert.equal(app.save().dialogueProgress,null);
  assert.equal(app.save().decorationQuest,null);
  assert.equal(app.save().openingSeen,false);
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
});


test('room placement and conversation portrait are separate, and only Deokgae interrupts',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true});app.click('#continue-story');
  assert.equal(app.node('#dialogue-portrait').hidden,false);
  assert.equal(app.node('#dialogue-portrait-image').src,'assets/characters/gongryong-placeholder.png');
  app.click('#dialogue-next');app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-speaker').textContent,'라더');
  assert.equal(app.node('#dialogue-text').textContent,'사람은 많은데?');
  assert.equal(app.node('#story-dialogue-ui').dataset.speaker,'rader');
  assert.equal(app.node('#dialogue-interruption').hidden,true);
  assert.equal(app.node('#dialogue-portrait').hidden,true);
  app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-portrait').hidden,false);
  for(let i=0;i<4;i++) app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-interruption').dataset.member,'deokgae');
  assert.equal(app.node('#dialogue-interruption').hidden,false);
  assert.equal(app.node('#dialogue-portrait').hidden,false);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/id="talk-gongryong"/);
  assert.match(html,/id="dialogue-portrait-image"/);
});
