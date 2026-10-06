const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./prologue-dom');
const State=require('../prologue-state');
function tourSave(scene='living-room'){return {...State.fresh(),scene,introDone:true,done:['arrival','welcome-door','welcome','photos','permission-question','permission'],flags:{entered_house:true,house_roam_enabled:true,room_tour_permission:true,met_gongryong:true}}}
function begin(){const b=boot();b.click('new-story');for(let i=0;i<20;i++)b.document.querySelector('#intro-monologue').click();b.advanceTime(1200);b.drainDialogue();b.click('door-hotspot');b.click('door-closeup-hotspot');b.drainDialogue();b.advanceTime(2000);b.drainDialogue();b.click('old-photos');b.drainDialogue();return b}
function task(b){b.click('go-stairs');b.click('go-upper-hall');b.click('go-attic');b.drainDialogue();b.click('attic-to-upper-hall');b.click('upper-hall-to-stairs');b.click('go-basement')}
test('new story plays the summer introduction and unlocks the tour only after the photos',()=>{
  const b=begin();const s=b.getSave();assert.equal(s.flags.house_roam_enabled,true);assert.equal(s.flags.room_tour_permission,true);assert.equal(s.flags.met_gongryong,true);assert.equal(b.document.querySelector('.hud-date'),null);
});
test('complete main route works without visiting any optional member room',()=>{
  const b=begin();task(b);assert.equal(b.getSave().flags.basement_task_started,true);b.click('target-box');b.drainDialogue();assert.equal(b.document.querySelector('#prism-object').hidden,false);b.click('prism-object');b.drainDialogue();b.click('prism-right');b.click('prism-right');b.advanceTime(500);b.drainDialogue();b.click('prism-face');b.drainDialogue();b.advanceTime(2200);
  const s=b.getSave();assert.equal(s.ending,true);assert.deepEqual(s.travelers,['dreamer','jamddul','suhyeon']);assert.equal(s.survivors.length,8);assert.ok(!s.done.some(x=>x.startsWith('room-')));assert.equal(b.document.querySelector('#ending-copy').hidden,false);
});
test('all six member rooms allow object inspection and restore on reload',()=>{
  const b=boot(tourSave('upper-hall'));b.click('continue-story');for(const m of State.members){b.click('door-'+m);b.drainDialogue();b.click('object-'+m);b.drainDialogue();const saved=b.getSave();assert.equal(saved.scene,'room-'+m);assert.ok(saved.done.includes('room-'+m+'-object'));const r=boot(saved);r.click('continue-story');assert.equal(r.document.querySelector('[data-scene="room-'+m+'"]').hidden,false);r.document.querySelector('[data-scene="room-'+m+'"] .scene-exit').click();assert.equal(r.getSave().scene,'upper-hall');b.document.querySelector('[data-scene="room-'+m+'"] .scene-exit').click()}
});
test('ordinary kitchen dialogue uses the main bar and distant kitchen voice preserves it',()=>{
  const b=boot(tourSave());b.click('continue-story');b.click('go-kitchen');for(let i=0;i<3;i++)b.click('dialogue-next');assert.equal(b.document.querySelector('#dialogue-speaker').textContent,'덕개');assert.equal(b.document.querySelector('#dialogue-interruption').hidden,true);
  const save=tourSave();save.done=['arrival'];save.pending={id:'welcome',state:{phase:'scene',index:1}};const side=boot(save);side.click('continue-story');assert.equal(side.document.querySelector('#dialogue-interruption').hidden,false);assert.equal(side.document.querySelector('#interruption-text').textContent,'‘좀’?');assert.equal(side.document.querySelector('#dialogue-speaker').textContent,'공룡');
});
test('unfinished room and fairy dialogues continue from the same saved line',()=>{
  for(const [id,scene,index]of [['room-jamddul-object','room-jamddul',1],['storage-object','storage',4],['fairies','attic',8],['crowd','basement',6]]){
    const s=tourSave(scene);s.pending={id,state:{phase:'scene',index}};if(id==='crowd')s.flags.prism_anomaly_started=true;
    const b=boot(s);b.click('continue-story');assert.equal(b.getSave().pending.id,id);assert.equal(b.getSave().pending.state.index,index);assert.equal(b.getSave().scene,scene);
  }
});
test('reload during house entry completes entry without replaying the knock',()=>{
  const s=tourSave('door-closeup');s.entryPending=true;s.done=['arrival','knock','welcome-door'];const b=boot(s);b.click('continue-story');b.advanceTime(1200);assert.equal(b.getSave().scene,'living-room');assert.equal(b.getSave().pending.id,'welcome');assert.equal(b.getSave().entryPending,false);
});
test('reload after the half-second prism glimpse resumes its reaction before another touch',()=>{
  const s=tourSave('basement');s.flags.prism_found=true;s.flags.target_box_found=true;s.rotation=2;s.angle=70;const b=boot(s);b.click('continue-story');assert.equal(b.getSave().pending.id,'prism-glimpse');b.drainDialogue();assert.equal(b.document.querySelector('#prism-inspector').hidden,false);assert.equal(b.document.querySelector('#prism-face').textContent,'다시 만져본다');
});
test('re-entering the house skips the first meeting and leaves the completed quest intact',()=>{
  const s=tourSave();s.flags.basement_task_started=true;const b=boot(s);b.click('continue-story');b.click('leave-house');b.click('door-hotspot');b.click('door-closeup-hotspot');b.advanceTime(1200);assert.equal(b.getSave().scene,'living-room');assert.equal(b.window.PixelyDialogue.isOpen(),false);assert.equal(b.getSave().flags.basement_task_started,true);
});
test('storage failure leaves a new game playable in memory',()=>{
  const b=boot(null,{failStorage:true});b.click('new-story');for(let i=0;i<20;i++)b.document.querySelector('#intro-monologue').click();b.advanceTime(1200);b.drainDialogue();b.click('door-hotspot');assert.equal(b.document.querySelector('[data-scene="door-closeup"]').hidden,false);assert.equal(b.document.querySelector('#continue-story').disabled,false);
});
test('original layered garden details enlarge and return without changing story progress',()=>{
  const s={...tourSave('exterior'),flags:{...tourSave().flags}};const b=boot(s);b.click('continue-story');
  const layers=b.document.querySelectorAll('.exterior-stage .exterior-layer');assert.equal(layers.length,15);
  assert.match(layers[0].src,/01-sky.png$/);assert.match(layers[14].src,/15-door-critter.png$/);
  for(const id of ['inspect-birdhouse','inspect-pot','inspect-garden','inspect-laundry']){
    b.click(id);assert.equal(b.document.querySelector('#outside-detail').hidden,false);assert.ok(b.document.querySelector('#outside-detail-copy').textContent.length>10);
    b.click('outside-detail-back');assert.equal(b.document.querySelector('#outside-detail').hidden,true);assert.equal(b.getSave().scene,'exterior');
  }
  b.click('door-hotspot');assert.equal(b.getSave().scene,'door-closeup');assert.equal(b.document.querySelectorAll('.door-camera .exterior-layer').length,15);
});
