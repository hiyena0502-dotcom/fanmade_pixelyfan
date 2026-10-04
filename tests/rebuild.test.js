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
  const scenes=['exterior','door-closeup','living-room','kitchen','stairs','bathroom','storage'].map(name=>Object.assign(node('scene:'+name),{dataset:{scene:name},hidden:name!=='exterior'}));
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
    start(){node('#new-story').click();for(let n=0;n<6;n++)node('#intro-monologue').click();flush();node('#dialogue-next').click();node('#dialogue-next').click();flush()},
    prepareEntry(){
      if(this.save()?.scene!=='door-closeup')node('#door-hotspot').click();
      node('#door-closeup-hotspot').click();
      if(this.save()?.doorInvited||this.save()?.chapterIntroSeen||this.save()?.openingSeen)return 'panel';
      node('#dialogue-next').click();
      node('#dialogue-choices').children[0].click();flush();
      if(node('#dialogue-text').textContent==='잠깐만!'){
        node('#dialogue-next').click();flush();node('#dialogue-next').click();node('#dialogue-next').click();
      }
      return 'dialogue';
    },
    enter(){if(this.prepareEntry()==='panel')node('#enter-house').click();else node('#dialogue-choices').children[0].click();flush()},
    activeElement:()=>document.activeElement,
    key(event){documentListeners.get('keydown').forEach(fn=>fn(event))},
    escape(){documentListeners.get('keydown').forEach(fn=>fn({key:'Escape',preventDefault(){}}))}};
}

test('arrival uses Dreamer subtitles, door cancellation stays at the door, and invitation survives exploration',()=>{
  const app=boot();app.click('#new-story');
  assert.equal(app.node('#intro-monologue-text').textContent,'오늘은 12월 28일.');
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  for(let n=0;n<6;n++)app.click('#intro-monologue');app.flush();
  assert.equal(app.node('#intro-monologue').hidden,true);
  assert.equal(app.node('#dialogue-text').textContent,'여기구나.');
  assert.equal(app.node('#dialogue-portrait').hidden,true);
  app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-text').textContent,'생각보다 조용한데… 다들 벌써 준비하고 있으려나?');
  app.click('#dialogue-next');app.flush();
  assert.equal(app.node('#quest-notice-title').textContent,'집에 들어가자');
  app.click('#door-hotspot');
  assert.equal(app.scenes[1].hidden,false);
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  app.click('#door-closeup-hotspot');
  assert.equal(app.node('#dialogue-text').textContent,'바로 들어가도 되려나?');
  app.click('#dialogue-next');app.node('#dialogue-choices').children[1].click();
  assert.equal(app.scenes[1].hidden,false);
  assert.equal(app.save().scene,"door-closeup");
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  app.prepareEntry();app.node('#dialogue-choices').children[1].click();
  assert.equal(app.save().doorInvited,true);
  assert.equal(app.scenes[1].hidden,false);
  assert.equal(app.save().scene,"door-closeup");
  const resumed=boot(app.save());resumed.click('#continue-story');resumed.click('#door-closeup-hotspot');
  assert.equal(resumed.node('#story-dialogue-ui').hidden,true);
  assert.equal(resumed.node('#door-choice').hidden,false);
  resumed.click('#enter-house');
  resumed.flush();assert.equal(resumed.scenes[2].hidden,false);
});

test('returning opens the door image and entry choices without repeating dialogue',()=>{
  for(const scene of ['exterior','door-closeup']){
    const app=boot({scene,chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted'});
    app.click('#continue-story');
    if(scene==='exterior'){
      app.click('#door-hotspot');assert.equal(app.scenes[1].hidden,false);
      assert.equal(app.node('#door-choice').hidden,true);
    }
    app.click('#door-closeup-hotspot');
    assert.equal(app.node('#door-choice').hidden,false);
    assert.equal(app.node('#story-dialogue-ui').hidden,true);
    assert.equal(app.save().outsideDialogue??null,null);
    app.click('#keep-looking');assert.equal(app.scenes[1].hidden,false);
    assert.equal(app.activeElement(),app.node('#door-closeup-hotspot'));
    app.click('#door-closeup-hotspot');app.click('#enter-house');app.flush();
    assert.equal(app.scenes[2].hidden,false);
    assert.equal(app.node('#story-dialogue-ui').hidden,true);
    app.click('#leave-house');app.enter();
    assert.equal(app.scenes[2].hidden,false);
  }
});

test('a saved repeated invitation restores entry choices without replaying dialogue',()=>{
  const app=boot({scene:'door-closeup',chapterIntroSeen:true,openingSeen:true,doorInvited:true,outsideDialogue:{kind:'invited',state:{phase:'scene',index:0}}});
  app.click('#continue-story');
  assert.equal(app.node('#door-choice').hidden,false);
  assert.equal(app.scenes[1].hidden,false);
  app.click('#enter-house');app.flush();
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  assert.equal(app.save().outsideDialogue,null);
});

test('chapter leads into the full opening, then a chosen reply starts the recorded quest',()=>{
  const app=boot();app.start();app.enter();
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.scenes[2].inert,true);
  assert.equal(app.node('#chapter-card').hidden,true);
  assert.equal(app.save().chapterIntroSeen,true);
  assert.equal(app.node('#dialogue-text').textContent,'어, 왔네?');
  assert.notEqual(app.save().decorationQuest,'accepted');
  for(let i=0;i<18;i++) app.click('#dialogue-next');
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
  app.click('#diary-button');assert.equal(app.node('#tool-content').children[0].textContent,'생일 장식 찾기');
  app.escape();assert.equal(app.node('#tool-sheet').hidden,true);
  app.click('#leave-house');app.enter();
  assert.equal(app.node('#story-dialogue-ui').hidden,true);
  assert.equal(app.scenes[2].inert,false);
  app.click('#talk-gongryong');
  assert.equal(app.node('#dialogue-text').textContent,'왜, 벌써 찾았어?');
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
  app.click('#leave-house');app.click('#door-hotspot');app.click('#door-closeup-hotspot');app.click('#panel-backdrop');
  assert.equal(app.scenes[1].hidden,false);
  assert.equal(app.node('#door-choice').hidden,true);
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
  app.prepareEntry();const enter=app.node('#dialogue-choices').children[0];enter.click();enter.click();
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
  for(let i=0;i<8;i++) app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-interruption').hidden,false);
  assert.equal(app.node('#dialogue-interruption').dataset.member,'deokgae');
  assert.equal(app.node('#interruption-text').textContent,'야, 정형준!');
  assert.equal(app.node('#dialogue-text').textContent,'요정들은 뭐… 알아서 오겠지.');
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.node('#interruption-text').textContent,'야, 정형준!');
  resumed.click('#dialogue-interruption');
  assert.equal(resumed.node('#interruption-text').textContent,'야, 정형준!');
  assert.equal(resumed.node('#dialogue-next').disabled,false);
  resumed.click('#dialogue-next');
  assert.equal(resumed.node('#dialogue-interruption').hidden,true);
  assert.equal(resumed.node('#dialogue-text').textContent,'왜!');
});

test('Dreamer speaks between Gongryong lines and old saves retain their original line',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true});app.click('#continue-story');
  for(let i=0;i<5;i++) app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-text').textContent,'아니, 요정들한테 생일 장식 몇 개 맡겨놨거든? 근데 아직 하나도 안 왔어!!');
  app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-speaker').textContent,'꿈뜰이');
  assert.equal(app.node('#story-dialogue-ui').dataset.speaker,'dreamer');
  assert.equal(app.node('#dialogue-text').textContent,'요정분들도 아직 안 오신 거예요?');
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.node('#dialogue-speaker').textContent,'꿈뜰이');
  resumed.click('#dialogue-next');
  assert.equal(resumed.node('#dialogue-text').textContent,'요정들은 뭐… 알아서 오겠지.');
  const old=boot({scene:'living-room',chapterIntroSeen:true,dialogueProgress:{phase:'opening',index:7,choice:null}});
  old.click('#continue-story');
  assert.equal(old.node('#interruption-text').textContent,'야, 정형준!');
  const migrated=boot(old.save());migrated.click('#continue-story');
  assert.equal(migrated.node('#interruption-text').textContent,'야, 정형준!');
});

test('talking again shows all three follow-up lines, resumes, and then offers choices',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted'});
  app.click('#continue-story');app.click('#talk-gongryong');
  assert.equal(app.node('#dialogue-text').textContent,'왜, 벌써 찾았어?');
  assert.equal(app.node('#dialogue-choices').hidden,true);
  app.click('#dialogue-next');
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.node('#dialogue-text').textContent,'아니면 어디 있는지 물어보려고?');
  resumed.click('#dialogue-next');
  assert.equal(resumed.node('#dialogue-text').textContent,'나도 몰라~ 그러니까 부탁한 거지.');
  assert.equal(resumed.node('#dialogue-choices').hidden,true);
  resumed.click('#dialogue-next');
  const picking=boot(resumed.save());picking.click('#continue-story');
  assert.equal(picking.node('#dialogue-text').textContent,'나도 몰라~ 그러니까 부탁한 거지.');
  assert.equal(picking.node('#dialogue-choices').children.length,3);
  picking.node('#dialogue-choices').children[1].click();
  picking.click('#dialogue-next');picking.click('#dialogue-next');
  assert.equal(picking.node('#story-dialogue-ui').hidden,true);
  assert.equal(picking.scenes[2].inert,false);
  assert.equal(picking.save().decorationQuest,'accepted');
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
    if(choice===0){
      for(let i=1;i<5;i++) resumed.click('#dialogue-next');
      assert.notEqual(resumed.save().decorationQuest,'accepted');
      assert.equal(resumed.node('#dialogue-text').textContent,'이것도 엄밀히 따지면 사장님한테 아부하는 일의 연장선이라고~');
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

test('decoration details keep the supplied six lines and resume at Rader before accepting the quest',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,dialogueProgress:{phase:'choices',index:0,choice:null}});
  app.click('#continue-story');app.node('#dialogue-choices').children[0].click();
  const expected=[
    '문구랑 스티커랑 뭐 이것저것 있어. 보면 알아~',
    '아, 또니도 한번 찾아봐. 걔한테 하나 있을걸?',
    '근데 걔 발견하면 티티부터 불러ㅋㅋ 또 어디 숨어서 쉬고 있을걸?',
    '왜 장식 찾으러 갔다가 또니까지 잡아와.',
    '잡아오랬냐? 위치만 불라고 했지.',
    '이것도 엄밀히 따지면 사장님한테 아부하는 일의 연장선이라고~'
  ];
  for(let i=0;i<3;i++){
    assert.equal(app.node('#dialogue-text').textContent,expected[i]);
    assert.notEqual(app.save().decorationQuest,'accepted');
    app.click('#dialogue-next');
  }
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.node('#dialogue-speaker').textContent,'라더');
  assert.equal(resumed.node('#story-dialogue-ui').dataset.speaker,'rader');
  assert.equal(resumed.node('#dialogue-interruption').hidden,true);
  for(let i=3;i<6;i++){
    assert.equal(resumed.node('#dialogue-text').textContent,expected[i]);
    assert.notEqual(resumed.save().decorationQuest,'accepted');
    resumed.click('#dialogue-next');
  }
  assert.equal(resumed.save().decorationQuest,'accepted');
  assert.equal(resumed.node('#story-dialogue-ui').hidden,true);
});

test('finished choices stay marked across reloads, remain clickable, and reset with a new story',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,dialogueProgress:{phase:'choices',index:0,choice:null}});
  app.click('#continue-story');app.node('#dialogue-choices').children[1].click();
  assert.equal(app.save().answeredDecorationChoices,undefined);
  app.click('#dialogue-next');app.click('#dialogue-next');
  assert.deepEqual(app.save().answeredDecorationChoices,[1]);
  const resumed=boot(app.save());resumed.click('#continue-story');resumed.click('#talk-gongryong');
  for(let i=0;i<3;i++) resumed.click('#dialogue-next');
  assert.equal(resumed.node('#dialogue-choices').children[1].classList.contains('is-read'),true);
  assert.equal(resumed.node('#dialogue-choices').children[0].classList.contains('is-read'),false);
  resumed.node('#dialogue-choices').children[1].click();
  assert.equal(resumed.node('#dialogue-text').textContent,'그걸 알았으면 내가 갔다 왔지.');
  resumed.click('#new-story');
  assert.deepEqual(resumed.save().answeredDecorationChoices,[]);
});

test('invalid dialogue progress restarts safely, and a new story clears the previous quest and branch',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted',dialogueProgress:{phase:'reply',choice:99,index:400}});
  app.click('#continue-story');assert.equal(app.node('#dialogue-text').textContent,'어, 왔네?');
  app.click('#new-story');
  assert.equal(app.save().dialogueProgress,null);
  assert.equal(app.save().decorationQuest,null);
  assert.equal(app.save().openingSeen,false);
  assert.equal(app.node('#intro-monologue-text').textContent,'오늘은 12월 28일.');
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
  assert.equal(app.node('#dialogue-portrait').hidden,false);
  assert.equal(app.node('#dialogue-portrait-image').src,'assets/characters/rader-v162.webp');
  app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-portrait').hidden,false);
  assert.equal(app.node('#dialogue-portrait-image').src,'assets/characters/gongryong-placeholder.png');
  for(let i=0;i<5;i++) app.click('#dialogue-next');
  assert.equal(app.node('#dialogue-interruption').dataset.member,'deokgae');
  assert.equal(app.node('#dialogue-interruption').hidden,false);
  assert.equal(app.node('#dialogue-portrait').hidden,false);
  assert.equal(app.node('#dialogue-portrait-image').src,'assets/characters/gongryong-placeholder.png');
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.match(html,/id="talk-gongryong"/);
  assert.match(html,/id="dialogue-portrait-image"/);
});

test('game animation defaults on and the explicit toggle remains usable without storage',()=>{
  const app=boot(undefined,{failStorage:true});
  assert.equal(app.node('html').getAttribute('data-game-motion'),'full');
  assert.equal(app.node('#toggle-motion').getAttribute('aria-pressed'),'true');
  app.click('#toggle-motion');
  assert.equal(app.node('html').getAttribute('data-game-motion'),'reduced');
  app.click('#toggle-motion');
  assert.equal(app.node('html').getAttribute('data-game-motion'),'full');
});
test('chapter replay preserves the quest and saved dialogue progress',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted',answeredDecorationChoices:[2]});
  app.click('#continue-story');
  const before=app.save();
  app.click('#replay-chapter');
  assert.equal(app.node('#chapter-card').hidden,false);
  app.flush();
  assert.equal(app.node('#chapter-card').hidden,true);
  assert.deepEqual(app.save(),before);
});

test('knock pauses cannot be skipped by keyboard and reload resumes the outside sequence',()=>{
  const app=boot();app.start();app.click('#door-hotspot');app.click('#door-closeup-hotspot');app.click('#dialogue-next');
  app.node('#dialogue-choices').children[0].click();
  assert.equal(app.node('#dialogue-text').textContent,'똑똑—');
  app.key({code:'Space',preventDefault(){}});
  assert.equal(app.node('#dialogue-text').textContent,'똑똑—');
  app.flush();
  assert.equal(app.node('#dialogue-speaker').textContent,'???');
  assert.equal(app.node('#dialogue-text').textContent,'잠깐만!');
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.node('#dialogue-text').textContent,'잠깐만!');
  resumed.click('#dialogue-next');resumed.flush();
  assert.equal(resumed.node('#dialogue-text').textContent,'문 열려 있어! 들어와!');
  resumed.click('#dialogue-next');resumed.click('#dialogue-next');
  const picking=boot(resumed.save());picking.click('#continue-story');
  assert.equal(picking.node('#dialogue-choices').children.length,2);
  assert.equal(picking.node('#dialogue-choices').children[1].textContent,'그래도 조금 더 둘러본다');
});

 test('room travel saves the kitchen, resumes there, and returns without replaying the opening',()=>{
  const saved={scene:'living-room',chapter:1,chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted'};
  const app=boot(saved);app.click('#continue-story');app.click('#go-kitchen');
  assert.equal(app.scenes[3].hidden,false);
  assert.equal(app.save().scene,'kitchen');
  assert.equal(app.node('#hud-place').textContent,'픽셀리 집 · 주방');
  assert.equal(app.node('#bag-button').disabled,false);
  assert.equal(app.node('#continue-copy').textContent,'CHAPTER I · 주방');
  const resumed=boot(app.save());resumed.click('#continue-story');
  assert.equal(resumed.scenes[3].hidden,false);
  resumed.click('#kitchen-to-living');
  assert.equal(resumed.scenes[2].hidden,false);
  assert.equal(resumed.save().scene,'living-room');
  assert.equal(resumed.node('#story-dialogue-ui').hidden,true);
  assert.equal(resumed.activeElement(),resumed.node('#go-kitchen'));
});
test('shape rooms support travel, tools, saves, reload, and return focus',()=>{
  for(const [room,label,index,parent,parentIndex] of [['stairs','계단',4,'living',2],['bathroom','화장실',5,'stairs',4],['storage','창고',6,'kitchen',3]]){
    const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted'});
    app.click('#continue-story');
    if(parent!=='living')app.click('#go-'+parent);
    app.click('#go-'+room);
    assert.equal(app.scenes[index].hidden,false);
    assert.equal(app.save().scene,room);
    assert.equal(app.node('#hud-place').textContent,'픽셀리 집 · '+label);
    for(const tool of ['#bag-button','#diary-button','#quest-hint-button']){
      app.click(tool);assert.equal(app.node('#tool-sheet').hidden,false);app.escape();
    }
    app.click('#story-menu-button');assert.equal(app.node('#story-menu').hidden,false);app.escape();
    const resumed=boot(app.save());resumed.click('#continue-story');
    assert.equal(resumed.scenes[index].hidden,false);
    resumed.click('#'+room+'-to-'+parent);
    assert.equal(resumed.scenes[parentIndex].hidden,false);
    assert.equal(resumed.activeElement(),resumed.node('#go-'+room));
    assert.equal(resumed.save().decorationQuest,'accepted');
  }
});

test('room travel cannot interrupt the first Gongryong conversation',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:false});
  app.click('#continue-story');app.click('#go-kitchen');
  assert.equal(app.scenes[2].hidden,false);
  assert.equal(app.save().scene,'living-room');
});

test('the small hint icon opens an empty window and never changes story progress',()=>{
  const saved={scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted',answeredDecorationChoices:[0,2]};
  const app=boot(saved);app.click('#continue-story');app.click('#quest-hint-button');
  assert.equal(app.node('#tool-content').children.length,0);
  assert.equal(app.node('#tool-title').textContent,'힌트');
  assert.equal(app.node('#tool-sheet').hidden,false);
  assert.equal(app.save().dialogueProgress,undefined);
  assert.deepEqual(app.save().answeredDecorationChoices,[0,2]);
  app.escape();assert.equal(app.node('#tool-sheet').hidden,true);
  assert.equal(app.activeElement(),app.node('#quest-hint-button'));
});

test('the diary contains only the task, without memo tabs or hint wording',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted',answeredDecorationChoices:[0]});
  app.click('#continue-story');assert.equal(app.node('#diary-notification').hidden,false);
  app.click('#diary-button');assert.equal(app.node('#diary-notification').hidden,true);
  const taskText=app.node('#tool-content').children.map(e=>e.textContent).join(' ');
  assert.match(taskText,/생일 장식 찾기/);
  assert.doesNotMatch(taskText,/또니|티티|문구랑|다락|복도|필립|프리츠|0\/4/);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.doesNotMatch(html,/journal-notes|journal-tabs/);
});

test('all tools and the empty hint window work outside and at the door before a quest',()=>{
  for(const scene of ['exterior','door-closeup']){
    const app=boot({scene,arrivalSeen:true,openingSeen:false});app.click('#continue-story');
    assert.equal(app.node('#bag-button').disabled,false);
    assert.equal(app.node('#diary-button').disabled,false);
    assert.equal(app.node('#quest-hint-button').hidden,false);
    app.click('#bag-button');assert.equal(app.node('#tool-content').children[0].textContent,'가방이 비어 있다.');app.escape();
    app.click('#diary-button');assert.equal(app.node('#tool-sheet').hidden,false);app.escape();
    app.click('#quest-hint-button');assert.equal(app.node('#tool-sheet').hidden,false);
    assert.equal(app.node('#tool-content').children.length,0);app.escape();
    app.click('#story-menu-button');assert.equal(app.node('#story-menu').hidden,false);
    assert.equal(app.node('#replay-chapter').disabled,true);
    assert.equal(app.save().scene,scene);
  }
});

test('replaying a seen chapter outside preserves the scene and restores menu focus',()=>{
  const app=boot({scene:'exterior',chapterIntroSeen:true,openingSeen:true,decorationQuest:'accepted'});
  app.click('#continue-story');app.click('#story-menu-button');
  assert.equal(app.node('#replay-chapter').disabled,false);
  app.click('#replay-chapter');app.flush();
  assert.equal(app.save().scene,'exterior');
  assert.equal(app.save().decorationQuest,'accepted');
  assert.equal(app.activeElement(),app.node('#story-menu-button'));
});

test('quests appear in the journal and announce once without a persistent tracker or history UI',()=>{
  const app=boot({scene:'living-room',chapterIntroSeen:true,dialogueProgress:{phase:'reply',choice:2,index:1,revision:2}});
  app.click('#continue-story');app.click('#dialogue-next');
  assert.equal(app.node('#quest-notice-title').textContent,'생일 장식 찾기');
  assert.equal(app.node('#quest-notice').classList.contains('is-visible'),true);
  app.flush();assert.equal(app.node('#quest-notice').classList.contains('is-visible'),false);
  app.click('#diary-button');assert.equal(app.node('#tool-content').children[0].textContent,'생일 장식 찾기');app.escape();
  app.click('#talk-gongryong');for(let i=0;i<3;i++)app.click('#dialogue-next');
  app.node('#dialogue-choices').children[2].click();app.click('#dialogue-next');app.click('#dialogue-next');
  assert.equal(app.node('#quest-notice').classList.contains('is-visible'),false);
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.doesNotMatch(html,/active-quest|mission-widget|dialogue-history-button|dialogue-log/);
});
