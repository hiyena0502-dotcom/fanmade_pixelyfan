const test=require('node:test');
const assert=require('node:assert/strict');
const {DEFAULTS,normalize,volume,canSkip}=require('../settings.js');

test('damaged or unsupported stored values fall back without changing defaults',()=>{
  for(const stored of [null,[],42,'broken']) assert.deepEqual(normalize(stored),DEFAULTS);
  const settings=normalize({motion:'false',textSpeed:999,textSize:500,unknown:'discard'});
  assert.equal(settings.motion,true);
  assert.equal(settings.textSpeed,35);
  assert.equal(settings.textSize,22);
  assert.equal('unknown' in settings,false);
});
test('volume and delay values stay in range and master mute overrides every sound bus',()=>{
  const settings=normalize({masterVolume:50,effectsVolume:80,textVolume:150,autoDelay:3333});
  assert.equal(normalize({effectsVolume:-20}).effectsVolume,0);
  assert.equal(settings.textVolume,100);
  assert.equal(settings.autoDelay,3500);
  assert.equal(volume(settings,'effects'),.4);
  for(const bus of ['effects','text']) assert.equal(volume({...settings,masterVolume:0},bus),0);
  assert.equal(volume({...settings,effectsEnabled:false},'effects'),0);
  assert.equal(volume({...settings,effectsEnabled:false},'text'),.5);
});
test('read-only skipping protects unseen dialogue while toggles survive JSON persistence',()=>{
  assert.equal(canSkip(DEFAULTS,false),false);
  assert.equal(canSkip(DEFAULTS,true),true);
  assert.equal(canSkip({...DEFAULTS,skipReadOnly:false},false),true);
  const settings=normalize({...DEFAULTS,motion:false,interactionHints:true,autoSave:false,textSpeed:0});
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(settings))),settings);
});

test('older effect preferences migrate to one switch, with explicit new choices taking precedence',()=>{
  for(const key of ['animations','leaves','smoke']) assert.equal(normalize({[key]:false}).motion,false);
  assert.equal(normalize({animations:true,leaves:true,smoke:true}).motion,true);
  assert.equal(normalize({motion:true,animations:false,leaves:false}).motion,true);
  assert.equal(normalize({motion:false,animations:true,smoke:true}).motion,false);
  const migrated=normalize({animations:false,masterVolume:25,textSize:26});
  assert.equal(migrated.masterVolume,25);
  assert.equal(migrated.textSize,26);
  for(const key of ['animations','leaves','smoke']) assert.equal(key in migrated,false);
});

test('object effects default on, preserve a saved toggle, and no effect selection remains',()=>{
  assert.equal(normalize().effectsEnabled,true);
  assert.equal(normalize({effectsEnabled:false}).effectsEnabled,false);
  const old=normalize({effectsSound:'none',musicVolume:70});
  assert.equal(old.effectsEnabled,true);
  assert.equal('effectsSound' in old,false);
  assert.equal('musicVolume' in old,false);
  assert.equal(normalize().textSound,'none');
  assert.equal(normalize({textSound:'unknown'}).textSound,'none');
  const selected=normalize({effectsEnabled:false,textSound:'bubble'});
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(selected))),selected);
});
