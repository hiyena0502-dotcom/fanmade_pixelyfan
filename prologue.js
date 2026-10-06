(()=>{'use strict';
const $=(q,r=document)=>r.querySelector(q),$$=(q,r=document)=>[...r.querySelectorAll(q)];
const State=window.PixelyPrologueState,Data=window.PixelyPrologueData,Audio=window.PixelyAudio;
const KEY='pixely-anniversary-prologue-v1',ART='assets/story/prologue/';
const asset=path=>window.PixelyAsset?window.PixelyAsset(path):path;
const names={gongryong:'공룡',rader:'라더',deokgae:'덕개',gakbyeol:'각별',suhyeon:'수현',jamddul:'잠뜰',ttoni:'또니',yukto:'육토',philip:'필립',fritz:'프리츠',dreamer:'꿈뜰이',stage:'상황',unknown:'???'};
const places={'exterior':'집 앞','door-closeup':'현관문','living-room':'거실',kitchen:'주방',storage:'창고',stairs:'계단',bathroom:'욕실','upper-hall':'2층 복도',attic:'다락',basement:'지하'};
let save=null,busy=false,timer=0,noticeTimer=0,toastTimer=0,lastOpener=null,motion=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,flash=false,drag=null;
const frame=$('.story-frame'),scenes=()=>$$('.scene[data-scene]');
try{save=State.normalize(JSON.parse(localStorage.getItem(KEY)||'null'));const preference=localStorage.getItem('pixely-game-motion');if(preference)motion=preference!=='reduced';flash=localStorage.getItem('pixely-prologue-flash')==='on'}catch{}
function node(tag,text='',className=''){const n=document.createElement(tag);n.textContent=text;n.className=className;return n}
function notice(text){$('#quest-notice-title').textContent=text;$('#quest-notice').classList.add('is-visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#quest-notice').classList.remove('is-visible'),2100)}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('is-visible'),2200)}
function store(){
  if(!save)return false;save.savedAt=Date.now();
  try{localStorage.setItem(KEY,JSON.stringify(save));renderContinue();return true}catch{toast('저장 공간을 사용할 수 없어. 현재 탭에서는 계속 플레이할 수 있어.');renderContinue();return false}
}
function flag(key,value=true){save.flags[key]=value}
function journal(text){if(!save.journal.includes(text))save.journal.push(text)}
function setBusy(value){busy=value;frame.classList.toggle('is-busy',value);scenes().forEach(s=>s.inert=value);$('.minimal-hud').inert=value}
function closePanels(restore=true){$$('.tool-sheet,.menu-sheet,.choice-sheet,.prism-inspector').forEach(n=>n.hidden=true);$('#panel-backdrop').hidden=true;if(restore)lastOpener?.focus({preventScroll:true});lastOpener=null}
function panel(selector,opener){closePanels(false);lastOpener=opener||document.activeElement;$(selector).hidden=false;$('#panel-backdrop').hidden=false;$(selector).focus({preventScroll:true})}
function renderContinue(){const b=$('#continue-story');b.disabled=!save;$('#continue-copy').textContent=save?(save.ending?'PROLOGUE · 완료':'PROLOGUE · '+(places[save.scene]||names[save.scene.slice(5)]+' 방')):'NO SAVE DATA'}
function showScreen(name){$$('[data-screen]').forEach(s=>{s.hidden=s.dataset.screen!==name;s.classList.toggle('is-active',!s.hidden)})}
function showScene(name){
  // Saves made before the close-up was removed resume in the same wide garden.
  if(name==='door-closeup')name='exterior';
  save.scene=State.scenes.includes(name)?name:'exterior';frame.dataset.location=save.scene;
  scenes().forEach(s=>{s.hidden=s.dataset.scene!==save.scene;s.classList.toggle('is-active',!s.hidden)});
  const placeNode=$('#hud-place');if(placeNode)placeNode.textContent='픽셀리 집 · '+(places[save.scene]||names[save.scene.slice(5)]+' 방');
  $('#diary-notification').hidden=save.journal.length===save.journalRead;
  $('#prism-object').hidden=!save.flags.target_box_found;
  $('#target-box').classList.toggle('is-found',!!save.flags.target_box_found);
  frame.dataset.crowd=save.flags.prism_anomaly_started?'arriving':'';
  Audio.scene(save.scene);store();
}
function image(scene,selector,src){const n=$(selector,$(`[data-scene="${scene}"]`));if(n){n.src=asset(ART+src);n.removeAttribute('width');n.removeAttribute('height')}}
function hotspot(scene,id,label,x,y,w,h,callback,visible=''){
  const b=node('button',visible,'pro-hotspot');b.type='button';b.id=id;b.setAttribute('aria-label',label);b.style.cssText=`left:${x}%;top:${y}%;width:${w}%;height:${h}%`;b.addEventListener('click',()=>{if(!busy){Audio.init();callback()}});$(scene).append(b);return b;
}
function inspect(id,text,member='dreamer'){dynamicScript(id,[{member,text}]);play(id)}
function dynamicScript(id,lines){Data.scripts[id]=lines}
function visited(scene){flag('visited_'+({'living-room':'livingroom','upper-hall':'second_floor'}[scene]||scene.replaceAll('-','_')))}
function move(to){
  if(busy)return;if(!State.canTravel(save,to)){notice(State.objective(save));return}
  closePanels(false);Audio.effect('step');showScene(to);visited(to);
  if(to==='kitchen'&&!save.done.includes('kitchen'))play('kitchen');
  else if(to==='storage'&&!save.done.includes('storage-hello'))play('storage-hello');
  else if(to.startsWith('room-')&&!save.done.includes(to+'-hello'))play(to+'-hello');
  else if(to==='attic'&&!save.flags.met_fairies){flag('attic_visited');play('fairies')}
  else if(to==='basement')flag('basement_entered');
  store();
}
function setup(){
  // Interactive room objects must remain exposed to accessibility navigation.
  $$('.shape-room-art,.upper-hall-art').forEach(art=>art.setAttribute('role','group'));
  // Keep every original layer in the artist's shared coordinate space.
  $('.exterior-stage').replaceChildren();const stage=$('.exterior-stage');
  stage.append(window.PixelyExterior.create());
  hotspot('.exterior-stage','door-hotspot','현관문 두드리기',46.8,57.5,6.2,14.8,knock);
  image('living-room','.living-room-art','living-room.svg');$('.living-room-art').alt='밝은 초여름 거실, 오래된 사진과 촬영 소품';
  image('kitchen','.kitchen-art','kitchen.svg');$('.kitchen-art').alt='음료와 컵이 놓인 밝은 주방';
  $$('.scene-snow,.home-snow,.hall-door-name,.inventory-rack,.hud-date,.hint-trigger').forEach(n=>n.remove());
  $('.home-illustration-slot').style.backgroundImage='none';$('.home-illustration-slot').replaceChildren(window.PixelyExterior.create({decorative:true}));
  hotspot('[data-scene="living-room"] .living-room-stage','old-photos','오래된 사진 살펴보기',50,58,14,9,()=>play(save.done.includes('photos')?'photos-repeat':'photos'));
  hotspot('[data-scene="living-room"] .living-room-stage','old-camera','옛 카메라 살펴보기',69,60,9,16,()=>inspect('camera','몇 번이고 촬영에 쓰였을 카메라다. 손잡이에 작은 흠집이 남아 있다.'));
  hotspot('[data-scene="living-room"] .living-room-stage','archive-books','자료 선반 살펴보기',68,27,11,32,()=>inspect('archive','사진, 파일, 촬영 소품… 오랫동안 모아 둔 흔적들이 나와 있다.'));
  hotspot('[data-scene="kitchen"]','kitchen-cups','수현과 덕개에게 말 걸기',57,43,15,13,()=>play('kitchen-repeat'));
  hotspot('[data-scene="storage"] .shape-room-art','storage-prop','각별과 소품 살펴보기',45,43,18,24,()=>play('storage-object'));
  const hall=$('[data-scene="upper-hall"] .upper-hall-art');
  const doors=[['suhyeon',3.375,15.86,14.625,81.1,'polygon(0 0,100% 7.6%,100% 83.8%,0 100%)'],['gakbyeol',24.3,24.64,9.45,53.46,'polygon(0 0,100% 7.4%,100% 84%,0 100%)'],['jamddul',37.35,30.12,5.85,36.22,'polygon(0 0,100% 6.8%,100% 85.4%,0 100%)'],['rader',82,15.86,14.625,81.1,'polygon(0 7.6%,100% 0,100% 100%,0 83.8%)'],['deokgae',66.25,24.64,9.45,53.46,'polygon(0 7.4%,100% 0,100% 100%,0 84%)'],['gongryong',56.8,30.12,5.85,36.22,'polygon(0 6.8%,100% 0,100% 100%,0 85.4%)']];
  for(const [m,x,y,w,h,clip]of doors){
    const marker=node('span','','door-token door-token--'+m);marker.style.cssText=`left:${x+w*.4}%;top:${y+h*.35}%`;marker.setAttribute('aria-hidden','true');hall.append(marker);
    const b=hotspot('[data-scene="upper-hall"] .upper-hall-art','door-'+m,names[m]+' 방으로 들어가기',x,y,w,h,()=>move('room-'+m));b.style.clipPath=clip;
    const scene=node('section','','scene member-room');scene.dataset.scene='room-'+m;scene.hidden=true;scene.setAttribute('aria-label',names[m]+'의 가상 방');
    const roomArt=node('div','','member-room-art');scene.append(roomArt);const img=node('img','','pro-scene-image');img.src=asset(ART+'room-'+m+'.svg');img.alt='공개한 소품과 자료가 있는 '+names[m]+'의 가상 방';roomArt.append(img);
    const back=node('button','','scene-back-arrow scene-exit');back.type='button';back.setAttribute('aria-label','2층 복도로 돌아가기');back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 8 7 7 7-7"/></svg>';back.addEventListener('click',()=>move('upper-hall'));scene.append(back);frame.insertBefore(scene,$('#story-dialogue-ui'));
    hotspot(`[data-scene="room-${m}"] .member-room-art`,'object-'+m,'책상 위 공개된 물건 살펴보기',49,53,20,16,()=>play('room-'+m+'-object'));
    hotspot(`[data-scene="room-${m}"] .member-room-art`,'shelf-'+m,'선반 살펴보기',69,27,11,34,()=>inspect('shelf-'+m,'촬영 소품과 오래된 자료가 놓여 있다. 꺼내 둔 물건들만 구경하기로 했다.'));
    hotspot(`[data-scene="room-${m}"] .member-room-art`,'hello-'+m,names[m]+'에게 말 걸기',30,27,18,35,()=>play('room-'+m+'-repeat'));
  }
  hotspot('[data-scene="upper-hall"] .upper-hall-art','fairy-room-door','요정방 문 두드리기',46.75,37.3,6.5,22,()=>play('fairy-door'));
  hotspot('[data-scene="attic"] .shape-room-art','attic-files','다락의 자료 살펴보기',32,45,30,25,()=>save.flags.basement_task_started?inspect('attic-files-repeat','상자에는 사진과 디자인 자료가 차곡차곡 정리되어 있다.'):play('task-question'));
  hotspot('[data-scene="basement"] .shape-room-art','wrong-box-1','오른쪽 상자 살펴보기',77,50,10,19,()=>inspect('wrong-box-1','이건 아닌 것 같다.'));
  hotspot('[data-scene="basement"] .shape-room-art','wrong-box-2','왼쪽 상자 살펴보기',10,54,13,21,()=>inspect('wrong-box-2','이것도 아니고…'));
  hotspot('[data-scene="basement"] .shape-room-art','old-set-prop','옛 촬영 소품 살펴보기',36,34,12,16,()=>inspect('old-set-prop','이거 아직도 있었구나.'));
  const target=hotspot('[data-scene="basement"] .shape-room-art','target-box','테이프가 붙은 큰 회색 상자 살펴보기',56,53,12,15,()=>{
    if(!save.flags.basement_task_started){inspect('box-before-task','테이프가 붙은 큰 회색 상자다. 오래된 촬영 소품들이 들어 있는 것 같다.');return}
    flag('target_box_found');if(!save.inventory.includes('소품 상자 메모'))save.inventory.push('소품 상자 메모');journal('지하에서 테이프가 붙은 큰 회색 상자를 찾았다.');
    dynamicScript('target-found',[{member:'dreamer',text:'큰 회색 상자에 테이프… 이거 맞는 것 같다.'},{member:'dreamer',text:'어? 옆에 있는 건…'}]);play('target-found');
  });target.classList.add('gray-box');
  const prism=hotspot('[data-scene="basement"] .shape-room-art','prism-object','선반의 유리 소품 살펴보기',66,40,5.5,12,()=>{flag('prism_found');if(!save.done.includes('prism-found'))play('prism-found');else openPrism()});prism.classList.add('prism-object');prism.hidden=true;const pimg=node('img');pimg.src=asset(ART+'prism-idle.svg');pimg.alt='';prism.append(pimg);
  const inspector=node('section','','prism-inspector');inspector.id='prism-inspector';inspector.hidden=true;inspector.tabIndex=-1;inspector.setAttribute('role','dialog');inspector.setAttribute('aria-modal','true');inspector.setAttribute('aria-label','프리즘 확대 조사');
  inspector.innerHTML='<h2>유리 소품</h2><div class="prism-turntable" id="prism-turntable"><div class="prism-beam"></div><div class="prism-lab-glimpse" aria-hidden="true"><i></i><i></i><i></i></div><img id="prism-detail" src="'+ART+'prism-idle.svg" alt="먼지가 앉은 유리 프리즘" draggable="false"/></div><p id="prism-copy">유리의 면을 천천히 살펴본다.</p><nav><button type="button" id="prism-left" aria-label="프리즘을 왼쪽으로 회전">↶</button><button type="button" id="prism-face">표면 살펴보기</button><button type="button" id="prism-right" aria-label="프리즘을 오른쪽으로 회전">↷</button></nav><button type="button" id="prism-back">조사를 마친다</button>';
  frame.append(inspector);$('#prism-left').addEventListener('click',()=>rotatePrism(-1));$('#prism-right').addEventListener('click',()=>rotatePrism(1));$('#prism-face').addEventListener('click',()=>{if(save.rotation>=2)beginAnomaly();else rotatePrism(1)});$('#prism-back').addEventListener('click',()=>closePanels());
  $('#prism-turntable').addEventListener('pointerdown',e=>{if(!busy){drag={x:e.clientX,id:e.pointerId};e.currentTarget.setPointerCapture(e.pointerId)}});
  $('#prism-turntable').addEventListener('pointerup',e=>{if(drag&&Math.abs(e.clientX-drag.x)>35)rotatePrism(e.clientX>drag.x?1:-1);drag=null});$('#prism-turntable').addEventListener('pointercancel',()=>drag=null);
  const effects=node('div','','prologue-effects');effects.id='prologue-effects';effects.setAttribute('aria-hidden','true');effects.innerHTML='<div class="prism-visions"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="prism-flash"></div>';frame.append(effects);
  const ending=node('section','','prologue-ending');ending.id='prologue-ending';ending.hidden=true;ending.setAttribute('aria-label','프롤로그 완료');ending.innerHTML='<div id="ending-copy" hidden><small>PROLOGUE</small><h2>프리즘 너머로</h2><p>꿈뜰이 · 잠뜰 · 수현</p><button type="button" id="ending-journal">기록 보기</button><button type="button" id="ending-home">메인 화면으로</button></div>';frame.append(ending);
  $('#ending-home').addEventListener('click',home);$('#ending-journal').addEventListener('click',()=>openTool('diary'));
  $('#replay-chapter').hidden=true;
  const sound=node('button');sound.id='toggle-sound';sound.type='button';sound.addEventListener('click',()=>{Audio.toggle();settingsUI()});$('#story-menu').insertBefore(sound,$('#return-home'));
  const flashes=node('button');flashes.id='toggle-flash';flashes.type='button';flashes.addEventListener('click',()=>{flash=!flash;try{localStorage.setItem('pixely-prologue-flash',flash?'on':'off')}catch{}settingsUI()});$('#story-menu').insertBefore(flashes,$('#return-home'));
  for(const stage of $$('.shape-room-art,.exterior-stage,.living-room-stage,.member-room-art')){const air=node('div','','summer-air');air.setAttribute('aria-hidden','true');for(let i=0;i<12;i++){const mote=node('i');mote.style.setProperty('--x',(12+i*6.1)+'%');mote.style.setProperty('--y',(23+(i*17)%54)+'%');mote.style.setProperty('--delay',(-i*.73)+'s');air.append(mote)}stage.append(air)}
  $$('.scene img').forEach(i=>i.draggable=false);settingsUI();
}
function settingsUI(){
  document.documentElement.dataset.gameMotion=motion?'full':'reduced';frame.dataset.flash=flash?'full':'reduced';
  $('#toggle-motion').textContent='애니메이션: '+(motion?'켜짐':'꺼짐');$('#toggle-motion').setAttribute('aria-pressed',String(motion));
  $('#home-motion').setAttribute('aria-pressed',String(motion));$('#home-motion').setAttribute('aria-label','배경 애니메이션 '+(motion?'끄기':'켜기'));
  $('#toggle-sound').textContent='생활 소리: '+(Audio.enabled?'켜짐':'꺼짐');$('#toggle-sound').setAttribute('aria-pressed',String(Audio.enabled));
  $('#toggle-flash').textContent='강한 빛 효과: '+(flash?'켜짐':'줄임');$('#toggle-flash').setAttribute('aria-pressed',String(flash));
}
function effect(name){
  if(!name)return;frame.dataset.effect='';void frame.offsetWidth;frame.dataset.effect=name;Audio.effect(name);
  if(['hum','flicker','box-fall','shake-light'].includes(name))$('#prism-object img').src=asset(ART+'prism-active.svg');
  if(['visions','warp','pull','fold'].includes(name))$('#prism-object img').src=asset(ART+'prism-overload.svg');
}
function play(id,resuming=null){
  const original=Data.scripts[id];if(!original?.length){toast('대화를 불러오지 못했어.');setBusy(false);return}
  const lines=id==='room-gongryong-object'&&!save.done.includes('storage-object')?original.map(line=>line.text.includes('그 논리 아까 별님')?{...line,text:'내 방이라고 내가 다 기억하는 건 아니지.'}:line):original;
  closePanels(false);setBusy(true);
  const options=id==='permission-question'?[{label:'네.'},{label:'사진으로만 봤어요.'}]:id==='task-question'?[{label:'제가 찾아볼까요?'}]:[];
  window.PixelyDialogue.play({lines,choices:options,saved:resuming,
    progress:state=>{
      save.pending={id,state};
    const line=lines[state.index];if(state.phase!=='scene-choices'&&line){effect(line.effect);const key=id+':'+state.index;
        if(!save.history.some(l=>l.key===key))save.history.push({...line,key,location:save.scene});
        if(id==='arrivals'&&line.member==='jamddul')flag('jamddul_arrived_basement');
        if(id==='arrivals'&&line.member==='suhyeon'&&!line.side)flag('suhyun_arrived_basement');
      }store();
    },
    complete:()=>finishScript(id),
    choose:()=>finishScript(id)
  });
}
function finishScript(id){
  save.pending=null;if(!save.done.includes(id))save.done.push(id);setBusy(false);store();
  if(id==='knock'){play('welcome-door')}
  else if(id==='arrival'){flag('intro_monologue_done');notice('집에 들어가자')}
  else if(id==='welcome-door'){enterHouse()}
  else if(id==='welcome'){flag('met_gongryong');journal('13주년을 맞아 오래된 사진과 소품을 꺼내 둔 집에 초대받았다.');notice('거실의 오래된 사진을 살펴보자')}
  else if(id==='photos'){play('permission-question')}
  else if(id==='permission-question'){play('permission')}
  else if(id==='permission'){flag('house_roam_enabled');flag('room_tour_permission');journal('멤버들이 집과 방을 구경해도 된다고 허락했다.');notice('집을 둘러보고 다락에 올라가 보자')}
  else if(id==='fairies'){flag('met_fairies');journal('다락에서 또니, 육토, 필립, 프리츠를 만났다.');play('task-question')}
  else if(id==='task-question'){play('task-accept')}
  else if(id==='task-accept'){flag('basement_task_started');journal('지하에서 테이프가 붙은 큰 회색 소품 상자를 찾아 달라는 부탁을 받았다.');notice('지하에서 옛 소품 상자를 찾자')}
  else if(id==='target-found'){showScene('basement')}
  else if(id==='prism-found'){journal('상자 옆에서 예전 전시에 쓰였던 프리즘을 발견했다.');openPrism()}
  else if(id==='prism-glimpse'){openPrism()}
  else if(id==='anomaly'){flag('members_heard_rumble');play('arrivals')}
  else if(id==='arrivals'){play('crowd')}
  else if(id==='crowd'){flag('prism_overload');play('overload')}
  else if(id==='overload'){finishPrologue()}
  store();
}
function enterHouse(){
  save.entryPending=true;store();setBusy(true);frame.classList.add('house-entering');const transition=$('#house-entry-transition');transition.hidden=false;transition.classList.add('is-active');
  clearTimeout(timer);timer=setTimeout(()=>{
    save.entryPending=false;transition.hidden=true;transition.classList.remove('is-active');frame.classList.remove('house-entering');flag('entered_house');showScene('living-room');visited('living-room');setBusy(false);
    if(!save.done.includes('welcome'))play('welcome');
  },motion?860:0);
}
function knock(){if(busy)return;if(save.flags.entered_house){enterHouse();return}
  dynamicScript('knock',[{member:'stage',text:'똑똑—',delay:600,effect:'knock'},{member:'stage',text:'안쪽에서 발소리가 가까워진다.',delay:800}]);play('knock');
}
function intro(){
  const overlay=$('#intro-monologue'),text=$('#intro-monologue-text');frame.classList.add('intro-running');overlay.hidden=false;setBusy(true);
  function render(){save.introIndex=Math.min(save.introIndex,Data.intro.length-1);text.classList.remove('is-visible');requestAnimationFrame(()=>{text.textContent=Data.intro[save.introIndex];text.classList.add('is-visible')});store()}
  render();
  const advance=()=>{if(!frame.classList.contains('intro-running')||frame.classList.contains('intro-reveal'))return;
    if(save.introIndex<Data.intro.length-1){save.introIndex++;render();return}
    save.introDone=true;flag('intro_monologue_done');store();frame.classList.add('intro-reveal');clearTimeout(timer);timer=setTimeout(()=>{
      overlay.hidden=true;frame.classList.remove('intro-running','intro-reveal');setBusy(false);play('arrival');
    },motion?1000:0);
  };
  overlay.onclick=advance;intro.advance=advance;
}
function start(isNew=false){
  clearTimeout(timer);closePanels(false);window.PixelyDialogue.close();frame.dataset.effect='';$('#prologue-ending').hidden=true;
  if(isNew)save=State.fresh();if(!save)return;showScreen('story');showScene(save.scene);setBusy(false);Audio.init();
  if(save.ending){showEnding();return}
  if(!save.introDone){intro();return}
  // Recreate transient scripts before resuming them after a reload.
  prepareDynamicScripts();
  if(save.entryPending){enterHouse();return}
  if(save.pending&&Data.scripts[save.pending.id]){play(save.pending.id,save.pending.state);return}
  if(save.flags.prism_anomaly_started){play(save.flags.prism_overload?'overload':'anomaly');return}
  if(save.flags.prism_found&&save.scene==='basement'){if(save.rotation>=2&&!save.done.includes('prism-glimpse'))play('prism-glimpse');else openPrism();return}
  if(!save.done.includes('arrival'))play('arrival');
  else if(save.scene==='living-room'&&!save.done.includes('welcome'))play('welcome');
}
function openPrism(){setBusy(false);panel('#prism-inspector',$('#prism-object'));renderPrism()}
function renderPrism(){
  $('#prism-detail').src=asset(ART+`prism-${save.rotation?'reflect':'idle'}.svg`);
  $('#prism-detail').style.transform=`rotateY(${save.angle}deg) rotateZ(${Math.sin(save.angle*Math.PI/180)*8}deg)`;
  $('#prism-copy').textContent=save.rotation>=2?'방금 보인 풍경을 다시 확인해 본다.':'유리의 면을 천천히 살펴본다.';
  
  $('#prism-face').textContent=save.rotation>=2?'다시 만져본다':'표면 살펴보기';
  $('#prism-inspector').dataset.rotation=save.rotation;
}
function rotatePrism(direction){
  if(busy||$('#prism-inspector').hidden)return;if(save.rotation>=2){save.angle+=direction*35;renderPrism();store();return}
  save.angle+=direction*35;save.rotation++;Audio.effect('glass');renderPrism();flag('prism_examined');store();
  if(save.rotation===1){$('#prism-copy').textContent='빛 한 줄이 벽에 반사된다.';journal('프리즘을 돌리자 빛이 벽에 반사되었다.')}
  if(save.rotation===2){busy=true;$('#prism-inspector').classList.add('show-glimpse');flag('prism_glimpse_seen');journal('프리즘 안에 연구소처럼 보이는 공간이 잠깐 나타났다.');store();
    clearTimeout(timer);timer=setTimeout(()=>{$('#prism-inspector').classList.remove('show-glimpse');busy=false;play('prism-glimpse')},500)
  }
}
function beginAnomaly(){if(busy)return;flag('prism_anomaly_started');save.rotation=3;closePanels(false);showScene('basement');journal('프리즘의 반응이 멈추지 않는다.');play('anomaly')}
function finishPrologue(){
  Audio.silence();Audio.scene('end');flag('prologue_accident_done');save.ending=true;save.pending=null;save.survivors=['gongryong','gakbyeol','rader','deokgae','ttoni','yukto','philip','fritz'];save.travelers=['dreamer','jamddul','suhyeon'];
  journal('잠뜰과 수현이 꿈뜰이를 붙잡던 순간, 세 사람이 빛에 휘말렸다.');store();showEnding();
}
function showEnding(){
  window.PixelyDialogue.close();setBusy(true);closePanels(false);$('#prologue-ending').hidden=false;$('#ending-copy').hidden=true;frame.dataset.effect='';Audio.scene('end');
  clearTimeout(timer);timer=setTimeout(()=>{$('#ending-copy').hidden=false;setBusy(false);$('#ending-home').focus({preventScroll:true})},2000);
}
function openTool(kind){
  if(busy)return;const content=$('#tool-content');content.replaceChildren();$('#tool-sheet').className='tool-sheet tool-sheet--'+kind;
  $('#tool-title').textContent=kind==='bag'?'꿈뜰이의 가방':'꿈뜰이의 기록장';
  if(kind==='bag'){for(const item of save.inventory)content.append(node('p',item));if(!save.inventory.length)content.append(node('p','가방이 비어 있다.'))}
  else{
    content.append(node('h3',State.objective(save)));for(const text of save.journal)content.append(node('p',text,'journal-entry'));
    const details=node('details');details.append(node('summary','대화 기록'));
    for(const line of save.history){if(line.member==='stage')continue;details.append(node('p',(names[line.member]||line.member)+' · '+line.text,'journal-dialogue'))}content.append(details);save.journalRead=save.journal.length;$('#diary-notification').hidden=true;store();
  }
  panel('#tool-sheet',kind==='bag'?$('#bag-button'):$('#diary-button'));
}
function home(){clearTimeout(timer);window.PixelyDialogue.close();closePanels(false);setBusy(false);frame.classList.remove('intro-running','intro-reveal','house-entering');$('#intro-monologue').hidden=true;showScreen('home');Audio.scene('home');renderContinue()}
function prepareDynamicScripts(){
  dynamicScript('knock',[{member:'stage',text:'똑똑—',delay:600,effect:'knock'},{member:'stage',text:'안쪽에서 발소리가 가까워진다.',delay:800}]);
  dynamicScript('gongryong-repeat',[{member:'gongryong',text:'위에도 다 열어놨어. 궁금하면 둘러봐.'}]);
  dynamicScript('photos-repeat',[{member:'dreamer',text:'사진마다 오래된 흔적이 남아 있다. 13년이면 정말 많겠다.'}]);
  dynamicScript('kitchen-repeat',[{member:'suhyeon',text:'물 필요하면 여기 있어.'},{member:'deokgae',text:'아까 그 음료는 진짜 제가 다 마신 건 아닌데요.'}]);
  dynamicScript('target-found',[{member:'dreamer',text:'큰 회색 상자에 테이프… 이거 맞는 것 같다.'},{member:'dreamer',text:'어? 옆에 있는 건…'}]);
  for(const m of State.members)dynamicScript('room-'+m+'-repeat',[{member:m,text:{jamddul:'궁금한 거 있으면 봐도 돼.',gakbyeol:'아까 그거, 한번 다시 해볼까.',suhyeon:'봤어? 진짜 별거 없지?',rader:'천천히 봐.',deokgae:'기대하신 만큼은 아니죠?',gongryong:'뭐 재밌는 거 찾았어?'}[m]}]);
  for(const [id,text]of Object.entries({'camera':'몇 번이고 촬영에 쓰였을 카메라다. 손잡이에 작은 흠집이 남아 있다.','archive':'사진, 파일, 촬영 소품… 오랫동안 모아 둔 흔적들이 나와 있다.','outside-bird':'작은 새집이다. 바람이 불 때마다 나뭇잎이 조금씩 흔들린다.','outside-pot':'화분이 잘 정돈되어 있다. 새잎도 올라왔네.','outside-garden':'풀 냄새가 난다. 벌써 여름이구나.','wrong-box-1':'이건 아닌 것 같다.','wrong-box-2':'이것도 아니고…','old-set-prop':'이거 아직도 있었구나.','box-before-task':'테이프가 붙은 큰 회색 상자다. 오래된 촬영 소품들이 들어 있는 것 같다.','attic-files-repeat':'상자에는 사진과 디자인 자료가 차곡차곡 정리되어 있다.'}))dynamicScript(id,[{member:'dreamer',text}]);
  for(const m of State.members)dynamicScript('shelf-'+m,[{member:'dreamer',text:'촬영 소품과 오래된 자료가 놓여 있다. 꺼내 둔 물건들만 구경하기로 했다.'}]);
}
setup();prepareDynamicScripts();
// The door opens into the greeting; re-entry bypasses all first-visit dialogue.

$('#new-story').addEventListener('click',()=>start(true));$('#continue-story').addEventListener('click',()=>start());
$('#talk-gongryong').addEventListener('click',()=>{if(busy)return;if(!save.flags.house_roam_enabled){notice('거실의 오래된 사진을 살펴보자');return}inspect('gongryong-repeat','위에도 다 열어놨어. 궁금하면 둘러봐.','gongryong')});
for(const [id,to]of Object.entries({'go-kitchen':'kitchen','kitchen-to-living':'living-room','go-storage':'storage','storage-to-kitchen':'kitchen','go-stairs':'stairs','stairs-to-living':'living-room','go-bathroom':'bathroom','bathroom-to-stairs':'stairs','go-upper-hall':'upper-hall','upper-hall-to-stairs':'stairs','go-basement':'basement','basement-to-stairs':'stairs','go-attic':'attic','attic-to-upper-hall':'upper-hall','leave-house':'exterior'}))$('#'+id).addEventListener('click',()=>move(to));
$('#story-menu-button').addEventListener('click',()=>{if(!busy)panel('#story-menu',$('#story-menu-button'))});$('#return-home').addEventListener('click',home);
$('#save-progress').addEventListener('click',()=>{if(store())toast('현재 진행을 저장했어.');closePanels()});$('#bag-button').addEventListener('click',()=>openTool('bag'));$('#diary-button').addEventListener('click',()=>openTool('diary'));
for(const button of ['toggle-motion','home-motion'])$('#'+button).addEventListener('click',()=>{motion=!motion;try{localStorage.setItem('pixely-game-motion',motion?'full':'reduced')}catch{}settingsUI()});
$('#panel-backdrop').addEventListener('click',()=>{if(!busy)closePanels()});
document.addEventListener('keydown',e=>{
  if(frame.classList.contains('intro-running')&&(e.code==='Enter'||e.code==='Space')&&!e.repeat){e.preventDefault();intro.advance?.();return}
  if(e.key==='Escape'&&!busy){closePanels();return}
  if(e.key==='Tab'){const p=$$('.tool-sheet,.menu-sheet,.prism-inspector').find(x=>!x.hidden);if(p){const b=$$('button:not(:disabled),summary',p).filter(n=>!n.hidden),first=b[0],last=b.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}
});
document.addEventListener('dragstart',e=>{if(e.target instanceof HTMLImageElement)e.preventDefault()});
window.addEventListener('pagehide',store);renderContinue();
})();
