const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const State=require('../prologue-state');
const Data=require('../prologue-data');

test('invalid and legacy saves cannot enter an incomplete new storyline',()=>{
  for(const bad of [null,[],{}, {scene:'basement'},{schema:1,scene:'missing'}])assert.equal(State.normalize(bad),null);
});
test('corrupted optional fields recover without losing a valid location',()=>{
  const s=State.normalize({schema:1,scene:'storage',flags:[],done:[null,'x','x'],history:[{},null,{member:'dreamer',text:'test'}],rotation:100,introIndex:-6});
  assert.equal(s.scene,'storage');assert.deepEqual(s.flags,{});assert.deepEqual(s.done,['x']);assert.equal(s.history.length,1);assert.equal(s.rotation,3);assert.equal(s.introIndex,0);
});
test('all six optional room saves retain their exact scene and pending line',()=>{
  for(const member of State.members){const pending={id:'room-'+member+'-object',state:{phase:'scene',index:2}};const s=State.normalize({...State.fresh(),scene:'room-'+member,pending});assert.deepEqual(s.pending,pending);assert.equal(s.scene,'room-'+member)}
});
test('house tour permission follows the introduction and never requires all six rooms',()=>{
  const s=State.fresh();assert.equal(State.canTravel(s,'attic'),false);assert.equal(State.canTravel(s,'room-jamddul'),false);
  s.flags.house_roam_enabled=true;s.flags.room_tour_permission=true;
  assert.equal(State.canTravel(s,'attic'),true);assert.equal(State.canTravel(s,'basement'),true);
  for(const m of State.members)assert.equal(State.canTravel(s,'room-'+m),true);
  assert.equal(s.done.length,0);
});
test('accident locks travel and ending has a stable completed objective',()=>{
  const s=State.fresh();s.flags.house_roam_enabled=true;s.flags.prism_anomaly_started=true;
  for(const scene of State.scenes)assert.equal(State.canTravel(s,scene),false);
  assert.equal(State.objective(s),'프리즘에서 떨어지자');s.ending=true;assert.equal(State.objective(s),'프롤로그 완료');
});
test('journal goal follows attic request, box discovery and prism investigation',()=>{
  const s=State.fresh();assert.equal(State.objective(s),'집에 들어가자');s.flags.entered_house=true;assert.match(State.objective(s),/사진/);
  s.flags.house_roam_enabled=true;assert.match(State.objective(s),/다락/);
  s.flags.basement_task_started=true;assert.match(State.objective(s),/상자/);
  s.flags.target_box_found=true;assert.match(State.objective(s),/주변/);
  s.flags.prism_found=true;assert.match(State.objective(s),/프리즘/);
});
test('document dialogue covers introduction, each room and the complete accident',()=>{
  assert.match(Data.intro.join(' '),/6월 1일/);assert.match(Data.intro.join(' '),/13주년/);
  for(const member of State.members){assert.ok(Data.scripts['room-'+member+'-hello'].length);assert.ok(Data.scripts['room-'+member+'-object'].length)}
  for(const id of ['arrival','welcome-door','welcome','photos','permission-question','permission','kitchen','storage-hello','storage-object','fairy-door','fairies','task-question','task-accept','prism-found','prism-glimpse','anomaly','arrivals','crowd','overload'])assert.ok(Data.scripts[id]?.length,id);
  for(const line of Object.values(Data.scripts).flat()){assert.ok(line.member);assert.ok(line.text);assert.equal(/생일 장식|12월 28일|설탕 어디|프리즘이 선택한/.test(line.text),false,line.text)}
});
test('approved lively introduction advances one short line at a time',()=>{
  assert.equal(Data.intro.length,12);
  assert.equal(Data.intro[0],'오늘은 6월 1일');
  assert.equal(Data.intro.at(-1),'직접 가보면 알겠지!');
  assert.ok(Data.intro.every(line=>!line.includes('\n')&&!/[^.]\.$/.test(line)));
});
test('member banter uses informal speech while the guest keeps polite greetings',()=>{
  for(const id of ['welcome','kitchen','storage-object','room-jamddul-hello','crowd']){
    for(const line of Data.scripts[id].filter(line=>['gongryong','deokgae','gakbyeol','jamddul','suhyeon','rader'].includes(line.member)))assert.equal(/요[.!?]?$|세요[.!?]?$/.test(line.text),false,line.text);
  }
  assert.equal(Data.scripts.welcome[2].text,'너 있는 데가 제일 어수선하거든?');
  assert.equal(Data.scripts['welcome-door'][1].text,'안녕하세요.');
});
test('distant voices are side bubbles while ordinary kitchen conversation stays in the main bar',()=>{
  assert.equal(Data.scripts.welcome.find(x=>x.member==='deokgae').side,true);
  assert.ok(Data.scripts.kitchen.filter(x=>x.member==='deokgae').every(x=>!x.side));
  assert.ok(Data.scripts.crowd.slice(0,5).every(x=>x.side));
});
test('four prism artwork states and all new room backgrounds exist',()=>{
  for(const file of ['exterior-summer','door-summer','living-room','kitchen',...State.members.map(x=>'room-'+x),...['idle','reflect','active','overload'].map(x=>'prism-'+x)]){
    const svg=fs.readFileSync(path.join(__dirname,'../assets/story/prologue',file+'.svg'),'utf8');assert.ok(svg.startsWith('<svg'));assert.ok(svg.endsWith('</svg>'));assert.equal(/<script|https?:\/\//.test(svg.replace('http://www.w3.org/2000/svg','')),false);
  }
});
test('active entry point loads new story scripts and omits old birthday runtime',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const script of ['prologue-state.js','prologue-data.js','prologue-audio.js','prologue.js','member-dialogue.js'])assert.ok(html.includes('src="'+script+'?v=178"'));
  assert.equal(/src="(?:rebuild|atmosphere)\.js/.test(html),false);assert.match(html,/<title>뜰팁/);
});
