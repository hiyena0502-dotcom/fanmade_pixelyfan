const test=require('node:test');
const assert=require('node:assert/strict');
const {DEFAULTS,normalize,volume,canSkip}=require('../settings.js');

test('damaged or unsupported stored values fall back without changing defaults',()=>{
  for(const stored of [null,[],42,'broken']) assert.deepEqual(normalize(stored),DEFAULTS);
  const settings=normalize({animations:'false',textSpeed:999,textSize:500,smoke:false,unknown:'discard'});
  assert.equal(settings.animations,true);
  assert.equal(settings.textSpeed,35);
  assert.equal(settings.textSize,22);
  assert.equal(settings.smoke,false);
  assert.equal('unknown' in settings,false);
});
test('volume and delay values stay in range and master mute overrides every sound bus',()=>{
  const settings=normalize({masterVolume:50,musicVolume:80,effectsVolume:-20,textVolume:150,autoDelay:3333});
  assert.equal(settings.effectsVolume,0);
  assert.equal(settings.textVolume,100);
  assert.equal(settings.autoDelay,3500);
  assert.equal(volume(settings,'music'),.4);
  for(const bus of ['music','effects','text']) assert.equal(volume({...settings,masterVolume:0},bus),0);
});
test('read-only skipping protects unseen dialogue while toggles survive JSON persistence',()=>{
  assert.equal(canSkip(DEFAULTS,false),false);
  assert.equal(canSkip(DEFAULTS,true),true);
  assert.equal(canSkip({...DEFAULTS,skipReadOnly:false},false),true);
  const settings=normalize({...DEFAULTS,animations:false,leaves:false,smoke:false,interactionHints:true,autoSave:false,textSpeed:0});
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(settings))),settings);
});
