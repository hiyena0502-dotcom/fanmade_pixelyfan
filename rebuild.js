(()=>{"use strict";
const SAVE_KEY="pixely-rebuild-save-v1";
const $=(q,r=document)=>r.querySelector(q);
const screens=[...document.querySelectorAll("[data-screen]")];
const scenes=[...document.querySelectorAll("[data-scene]")];
let toastTimer=0;
let introCleanup=null;
let busy=false;
let sessionSave;
let panelOpener=null;
const panelSelectors=["#tool-sheet","#story-menu"];
const journal=window.PixelyJournal;
let journalTab="tasks",hintIndex=0;

// Game motion is explicit: the requested effects must not silently disappear
// when Windows/Chrome reports reduced motion. Players can still turn it off.
const MOTION_KEY="pixely-game-motion";
function applyMotion(enabled){
  $("html").setAttribute("data-game-motion",enabled?"full":"reduced");
  $("#toggle-motion").textContent=enabled?"애니메이션: 켜짐":"애니메이션: 꺼짐";
  $("#toggle-motion").setAttribute("aria-pressed",String(enabled));
}
let motionEnabled=true;
try{motionEnabled=localStorage.getItem(MOTION_KEY)!=="reduced"}catch{}
applyMotion(motionEnabled);
$("#toggle-motion").addEventListener("click",()=>{
  motionEnabled=!motionEnabled;applyMotion(motionEnabled);
  try{localStorage.setItem(MOTION_KEY,motionEnabled?"full":"reduced")}catch{}
});
$("#replay-chapter").addEventListener("click",()=>{
  if(busy||scenes.find(scene=>!scene.hidden)?.dataset.scene!=="living-room") return;
  closePanels(false);setBusy(true);
  playChapterCard({number:1,title:"생일 준비"},()=>{setBusy(false);$("#talk-gongryong").focus({preventScroll:true})});
});


function buildHomeSnow(){
  const layer=$("#home-snow");
  if(!layer || layer.childElementCount) return;
  const fragment=document.createDocumentFragment();
  for(let i=0;i<24;i++){
    const flake=document.createElement("i");
    flake.style.setProperty("--snow-x",(Math.random()*100).toFixed(2)+"%");
    flake.style.setProperty("--snow-size",(5+Math.random()*10).toFixed(1)+"px");
    flake.style.setProperty("--snow-duration",(8+Math.random()*10).toFixed(2)+"s");
    flake.style.setProperty("--snow-delay",(-Math.random()*18).toFixed(2)+"s");
    flake.style.setProperty("--snow-drift",((Math.random()-.5)*140).toFixed(0)+"px");
    flake.style.setProperty("--snow-opacity",(0.38+Math.random()*.55).toFixed(2));
    fragment.appendChild(flake);
  }
  layer.appendChild(fragment);
}
buildHomeSnow();

document.querySelectorAll("img").forEach(img=>{img.draggable=false});
document.addEventListener("dragstart",event=>{
  if(event.target instanceof HTMLImageElement) event.preventDefault();
});

const INTRO_LINES=[
  "오늘은 12월 28일.",
  "잠뜰님의 생일이다.",
  "그래서 아침부터 여기까지 왔다.",
  "다들 준비하고 있다고 했으니까…",
  "나도 조금이라도 도울 수 있으면 좋겠는데...",
  "…뭐, 오늘 하루는 별일 없겠지?"
];


function toast(message){
  const node=$("#toast");
  node.textContent=message;
  node.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>node.classList.remove("is-visible"),1700);
}
function readSave(){
  if(sessionSave!==undefined) return sessionSave;
  try{
    const save=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");
    sessionSave=save&&typeof save==="object"&&!Array.isArray(save)&&scenes.some(s=>s.dataset.scene===save.scene)?save:null;
  }catch{sessionSave=null}
  return sessionSave;
}
function writeSave(scene="exterior",patch={}){
  const previous=readSave()||{};
  scene=normalizeStoryScene(scene);
  const data={
    ...previous,
    scene,
    chapter:previous.chapterIntroSeen||["living-room","kitchen"].includes(scene)?1:0,
    ...patch,
    savedAt:Date.now()
  };
  sessionSave=data;
  updateJournalUI(data);
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data))}
  catch{renderContinue();toast("이번 진행은 현재 탭에서만 유지돼. 브라우저 저장 공간을 사용할 수 없어.");return null}
  renderContinue();
  return data;
}
function renderContinue(){
  const save=readSave(),button=$("#continue-story"),copy=$("#continue-copy");
  button.disabled=!save;
  const labels={"exterior":"12월 28일 · 집 앞","door-closeup":"12월 28일 · 문 앞","living-room":"CHAPTER I · 거실","kitchen":"CHAPTER I · 주방"};
  copy.textContent=save?labels[save.scene]:"NO SAVE DATA";
}
function showScreen(name){
  screens.forEach(screen=>{
    const on=screen.dataset.screen===name;
    screen.hidden=!on;
    screen.classList.toggle("is-active",on);
  });
}
function showScene(name){
  $(".story-frame").dataset.scene=name;
  scenes.forEach(scene=>{
    const on=scene.dataset.scene===name;
    scene.hidden=!on;
    scene.classList.toggle("is-active",on);
  });
  const placeLabel=name==="living-room"
    ?"픽셀리 집 · 거실"
    :name==="kitchen"
      ?"픽셀리 집 · 주방"
      :name==="door-closeup"
      ?"픽셀리 집 · 문 앞"
      :"픽셀리 집 앞";
  $("#hud-place").textContent=placeLabel;

  $("#bag-button").disabled=!["living-room","kitchen"].includes(name);
  $("#diary-button").disabled=!["living-room","kitchen"].includes(name);
  updateJournalUI(readSave());
}
function normalizeStoryScene(scene){
  return scenes.some(s=>s.dataset.scene===scene)?scene:"exterior";
}
function setBusy(on){
  busy=on;
  $(".story-frame").classList.toggle("is-busy",on);
  scenes.forEach(scene=>{scene.inert=on});
  $(".minimal-hud").inert=on;
}
function closePanels(restoreFocus=true){
  panelSelectors.forEach(selector=>$(selector).hidden=true);
  $("#panel-backdrop").hidden=true;
  const opener=panelOpener;
  panelOpener=null;
  if(restoreFocus) opener?.focus({preventScroll:true});
}
function openPanel(selector,opener,focusTarget=selector){
  closePanels(false);
  panelOpener=$(opener);
  $(selector).hidden=false;
  $("#panel-backdrop").hidden=false;
  $(focusTarget).focus({preventScroll:true});
}
$("#panel-backdrop").addEventListener("click",()=>closePanels());

function startStory(scene="exterior"){
  introCleanup?.();
  introCleanup=null;
  window.PixelyDialogue.close();
  setBusy(false);
  scene=normalizeStoryScene(scene);
  showScreen("story");
  showScene(scene);
  closePanels(false);

  updateJournalUI(readSave());
  const pending=readSave()?.outsideDialogue;
  if(["exterior","door-closeup"].includes(scene)&&pending){playOutside(pending.kind,pending.state);return}
  if(scene==="living-room"&&(readSave()?.dialogueProgress||!readSave()?.openingSeen)) beginGongryongDialogue();
}
function runPrologue(){
  if(!INTRO_LINES.length){
    startStory("exterior");
    return;
  }
  startStory("exterior");
  const frame=$(".story-frame");
  const overlay=$("#intro-monologue");
  const text=$("#intro-monologue-text");
  let index=0;
  let finished=false;
  setBusy(true);

  frame.classList.add("intro-running");
  overlay.hidden=false;

  const render=()=>{
    text.textContent=INTRO_LINES[index];
    text.classList.add("is-visible");
  };

  const cleanup=()=>{
    overlay.removeEventListener("click",advance);
    document.removeEventListener("keydown",keyAdvance);
  };

  const finish=()=>{
    if(finished) return;
    finished=true;
    cleanup();
    introCleanup=null;
    text.classList.remove("is-visible");
    frame.classList.add("intro-reveal");

    window.setTimeout(()=>{
      overlay.hidden=true;
      frame.classList.remove("intro-running","intro-reveal");
      runIntro();
    },950);
  };

  const advance=()=>{
    if(finished) return;
    if(index>=INTRO_LINES.length-1){
      finish();
      return;
    }
    index++;
    render();
  };

  const keyAdvance=event=>{
    if(event.repeat) return;
    if(event.code==="Space"||event.code==="Enter"){
      event.preventDefault();
      advance();
    }
  };

  render();
  overlay.addEventListener("click",advance);
  document.addEventListener("keydown",keyAdvance);
  introCleanup=cleanup;
}
function runIntro(saved=null){
  startStory("exterior");
  playOutside("arrival",saved);
}
const outsideScripts={
  birdhouse:{lines:[{member:"dreamer",text:"작은 새집이다. 입구에도 눈이 조금 쌓여 있다."}]},
  pot:{lines:[{member:"dreamer",text:"추운데도 화분은 잘 정돈되어 있네."}]},
  garden:{lines:[{member:"dreamer",text:"텃밭도 눈으로 덮여 있네."}]},
  arrival:{lines:[
    {member:"dreamer",text:"여기구나."},
    {member:"dreamer",text:"생각보다 조용한데… 다들 벌써 준비하고 있으려나?"}
  ]},
  door:{lines:[{member:"dreamer",text:"바로 들어가도 되려나?"}],choices:[{label:"노크해본다"},{label:"조금 더 둘러본다"}]},
  knock:{lines:[
    {member:"stage",text:"똑똑—",delay:1000,effect:"knock"},
    {member:"stage",text:"……",delay:800},
    {member:"stage",text:"집 안쪽에서 무언가 우당탕 넘어지는 소리가 난다.",delay:1500,effect:"crash"},
    {member:"unknown",text:"잠깐만!"},
    {member:"stage",text:"……",delay:1000},
    {member:"unknown",text:"문 열려 있어! 들어와!"},
    {member:"dreamer",text:"……들어가도 되는 것 같네."}
  ],choices:[{label:"들어간다"},{label:"그래도 조금 더 둘러본다"}]},
  invited:{lines:[{member:"dreamer",text:"……들어가도 되는 것 같네."}],choices:[{label:"들어간다"},{label:"그래도 조금 더 둘러본다"}]}
};
function finishOutside(scene="exterior"){
  window.PixelyDialogue.close();setBusy(false);
  $(".story-frame").dataset.doorEffect="";
  showScene(scene);writeSave(scene,{outsideDialogue:null,arrivalSeen:true});
  $(scene==="door-closeup"?"#door-closeup-hotspot":"#door-hotspot").focus({preventScroll:true});
}
function playOutside(kind,saved=null){
  const script=outsideScripts[kind];if(!script){finishOutside();return}
  closePanels(false);setBusy(true);
  const scene=["door","knock","invited"].includes(kind)?"door-closeup":"exterior";
  showScene(scene);
  window.PixelyDialogue.play({...script,saved,line:recordDialogueLine,
    progress:state=>{
      $(".story-frame").dataset.doorEffect=script.lines[state.index]?.effect||"";
      writeSave(scene,{outsideDialogue:{kind,state}});
    },
    complete:()=>{finishOutside();if(kind==="arrival")toast("집에 들어가자")},
    choose:index=>{
      if(index===1){if(kind!=="door")writeSave("door-closeup",{doorInvited:true});finishOutside("door-closeup");return}
      if(kind==="door"){writeSave("door-closeup",{doorInvited:false});playOutside("knock");return}
      writeSave("door-closeup",{outsideDialogue:null,doorInvited:true,arrivalSeen:true});
      setBusy(false);enterHouse();
    }
  });
}
function beginDoor(){
  if(busy)return;
  playOutside(readSave()?.doorInvited?"invited":"door");
}
function playChapterCard({number,title},after){
  const card=$("#chapter-card");
  const frame=$(".story-frame");
  const roman=[[1000,"M"],[900,"CM"],[500,"D"],[400,"CD"],[100,"C"],[90,"XC"],[50,"L"],[40,"XL"],[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]];
  let remaining=number,numeral="";
  for(const [value,glyph] of roman){while(remaining>=value){numeral+=glyph;remaining-=value}}
  $("#chapter-number").textContent=numeral;
  $("#chapter-number").setAttribute("aria-label",`챕터 ${number}`);
  $("#chapter-title").textContent=title;
  frame.classList.add("chapter-playing");
  card.hidden=false;
  card.classList.remove("is-active","is-leaving");

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>card.classList.add("is-active"));
  });

  window.setTimeout(()=>card.classList.add("is-leaving"),3400);
  window.setTimeout(()=>{
    card.hidden=true;
    card.classList.remove("is-active","is-leaving");
    frame.classList.remove("chapter-playing");
    after?.();
  },5000);
}

async function enterHouse(){
  if(busy) return;
  closePanels(false);
  setBusy(true);
  const frame=$(".story-frame");
  const transition=$("#house-entry-transition");
  const image=$(".living-room-art");
  // Finish image decoding before changing the scene, rather than during its reveal.
  if(typeof image?.decode==="function"){
    try{await image.decode()}catch{/* The browser still displays its normal image fallback. */}
  }
  frame.classList.add("house-entering");
  transition.hidden=false;
  transition.classList.remove("is-active");
  requestAnimationFrame(()=>requestAnimationFrame(()=>transition.classList.add("is-active")));
  window.setTimeout(()=>showScene("living-room"),700);
  window.setTimeout(()=>{
    transition.hidden=true;
    transition.classList.remove("is-active");
    frame.classList.remove("house-entering");
    const finish=()=>{
      writeSave("living-room",{chapter:1,chapterIntroSeen:true});
      setBusy(false);
      if(readSave()?.dialogueProgress||!readSave()?.openingSeen) beginGongryongDialogue();
      else $("#talk-gongryong").focus({preventScroll:true});
    };
    if(readSave()?.chapterIntroSeen){finish();return}
    playChapterCard({number:1,title:"생일 준비"},finish);
  },860);
}

function beginGongryongDialogue(){
  if(busy) return;
  closePanels(false);
  setBusy(true);
  const save=readSave();
  window.PixelyDialogue.open({
    saved:save?.dialogueProgress,
    repeat:Boolean(save?.openingSeen),
    answeredChoices:save?.answeredDecorationChoices,
    line:recordDialogueLine,
    progress:dialogueProgress=>writeSave("living-room",{dialogueProgress}),
    complete:({choice})=>{
      const newlyAccepted=readSave()?.decorationQuest!=="accepted";
      const previous=readSave()?.answeredDecorationChoices;
      const answeredDecorationChoices=[...new Set([...(Array.isArray(previous)?previous:[]),choice])].filter(value=>Number.isInteger(value)&&value>=0&&value<3);
      writeSave("living-room",{openingSeen:true,dialogueProgress:null,decorationQuest:"accepted",answeredDecorationChoices});
      setBusy(false);
      $("#talk-gongryong").focus({preventScroll:true});
      if(newlyAccepted) toast("새 부탁이 기록장에 추가됐어.");
    }
  });
}
$("#talk-gongryong").addEventListener("click",beginGongryongDialogue);
document.querySelectorAll("[data-outside-object]").forEach(button=>button.addEventListener("click",()=>{if(!busy)playOutside(button.dataset.outsideObject)}));

function updateJournalUI(save){
  $("#active-quest").textContent=save?.decorationQuest==="accepted"?"생일 장식 찾기":save?.chapterIntroSeen?"":"집에 들어가자";
  $("#quest-hint-button").hidden=save?.decorationQuest!=="accepted";
  const unread=Boolean(save&&(save.decorationQuest==="accepted"||journal.notes(save).length)&&save.journalSeenRevision!==journal.revision(save));
  $("#diary-notification").hidden=!unread;
  $("#diary-button").setAttribute("aria-label",unread?"다이어리 · 새 기록":"다이어리");
}
function recordDialogueLine(line){
  const save=readSave()||{};
  writeSave(save.scene||"exterior",journal.record(save,line));
}
function element(tag,text,className=""){
  const node=document.createElement(tag);node.textContent=text;node.className=className;return node;
}
function renderJournal(){
  const content=$("#tool-content"),save=readSave();content.replaceChildren();
  $("#journal-tasks").setAttribute("aria-pressed",String(journalTab==="tasks"));
  $("#journal-notes").setAttribute("aria-pressed",String(journalTab==="notes"));
  if(journalTab==="tasks"){
    content.appendChild(element("h3",save?.decorationQuest==="accepted"?"생일 장식 찾기":"아직 받은 부탁이 없어."));
    if(save?.decorationQuest==="accepted"){
      content.appendChild(element("p","공룡의 부탁", "journal-kicker"));
      content.appendChild(element("p","집을 둘러보면서 요정들에게 생일 장식을 받아 오자."));
    }
  }else{
    const notes=journal.notes(save);
    if(!notes.length) content.appendChild(element("p","대화에서 알아낸 내용이 여기에 적혀. 궁금한 건 공룡에게 물어보자."));
    notes.forEach(note=>{
      const card=element("blockquote",note.text,"journal-note");
      card.appendChild(element("cite","공룡에게 들은 이야기"));content.appendChild(card);
    });
  }
}
function openTool(kind){
  if(busy) return;
  const sheet=$("#tool-sheet"),content=$("#tool-content");
  sheet.className="tool-sheet tool-sheet--"+kind;
  $("#tool-title").textContent=kind==="bag"?"꿈뜰이의 가방":"꿈뜰이의 기록장";
  $("#journal-tabs").hidden=kind!=="diary";
  if(kind==="diary"){
    journalTab="tasks";renderJournal();
    const save=readSave();if(save&&!journal.notes(save).length)writeSave(save.scene,{journalSeenRevision:journal.revision(save)});
  }else{content.replaceChildren();content.appendChild(element("p","가방이 비어 있다."))}
  openPanel("#tool-sheet",kind==="bag"?"#bag-button":"#diary-button");
}
function renderHints(){
  const content=$("#tool-content"),hints=journal.availableHints(readSave());content.replaceChildren();
  content.appendChild(element("p","공룡에게 들은 이야기를 하나씩 떠올려 보자.","journal-kicker"));
  hints.slice(0,hintIndex).forEach(hint=>content.appendChild(element("blockquote",hint.text,"journal-note")));
  if(hintIndex<hints.length){
    const button=element("button",hintIndex?"다음 힌트":"힌트 보기","hint-reveal");
    button.addEventListener("click",()=>{hintIndex++;renderHints();$("#tool-sheet").focus({preventScroll:true})});content.appendChild(button);
  }else{
    content.appendChild(element("p",journal.notes(readSave()).length?"지금까지 들은 힌트는 여기까지야.":"더 궁금하면 공룡에게 ‘어떤 장식인데요?’를 물어보자."));
  }
}
$("#quest-hint-button").addEventListener("click",()=>{
  if(busy||readSave()?.decorationQuest!=="accepted") return;
  hintIndex=0;$("#tool-sheet").className="tool-sheet tool-sheet--hint";
  $("#tool-title").textContent="힌트";$("#journal-tabs").hidden=true;renderHints();
  openPanel("#tool-sheet","#quest-hint-button");
});
$("#journal-tasks").addEventListener("click",()=>{journalTab="tasks";renderJournal()});
$("#journal-notes").addEventListener("click",()=>{journalTab="notes";renderJournal();const save=readSave();if(save)writeSave(save.scene,{journalSeenRevision:journal.revision(save)})});
function closeDialogueLog(){
  window.PixelyDialogue.resume();
  $("#dialogue-log").hidden=true;$("#dialogue-log-backdrop").hidden=true;
  $("#story-dialogue-ui").inert=false;
  if(window.PixelyDialogue.isOpen()) $("#dialogue-history-button").focus({preventScroll:true});
}
$("#dialogue-history-button").addEventListener("click",()=>{
  window.PixelyDialogue.pause();
  const content=$("#dialogue-log-content");content.replaceChildren();
  const names={gongryong:"공룡",rader:"라더",deokgae:"덕개",dreamer:"꿈뜰이",unknown:"???",stage:"상황"};
  const lines=journal.log(readSave());
  if(!lines.length)content.appendChild(element("p","이전에 지나간 대화는 아직 기록되지 않았어."));
  lines.forEach(line=>{const row=element("div","","log-entry");row.appendChild(element("strong",names[line.member]||""));row.appendChild(element("p",line.text));content.appendChild(row)});
  $("#dialogue-log").hidden=false;$("#dialogue-log-backdrop").hidden=false;
  $("#story-dialogue-ui").inert=true;$("#dialogue-log").focus({preventScroll:true});
  content.scrollTop=content.scrollHeight;
});
$("#dialogue-log-backdrop").addEventListener("click",closeDialogueLog);
$("#new-story").addEventListener("click",()=>{
  writeSave("exterior",{chapter:0,chapterIntroSeen:false,openingSeen:false,dialogueProgress:null,decorationQuest:null,answeredDecorationChoices:[],dialogueLog:[],heardHints:[],journalSeenRevision:null,outsideDialogue:null,arrivalSeen:false,doorInvited:false});
  runPrologue();
});
$("#continue-story").addEventListener("click",()=>{
  const save=readSave();
  if(save) startStory(save.scene||"exterior");
});
$("#door-hotspot").addEventListener("click",beginDoor);
$("#door-closeup-hotspot").addEventListener("click",beginDoor);
$("#door-closeup-back").addEventListener("click",()=>{
  closePanels(false);
  showScene("exterior");
  writeSave("exterior");
  $("#door-hotspot").focus({preventScroll:true});
});

function moveRoom(destination,focusTarget){
  if(busy) return;
  closePanels(false);
  showScene(destination);
  writeSave(destination);
  $(focusTarget).focus({preventScroll:true});
}
$("#go-kitchen").addEventListener("click",()=>moveRoom("kitchen","#kitchen-to-living"));
$("#kitchen-to-living").addEventListener("click",()=>moveRoom("living-room","#go-kitchen"));

$("#leave-house").addEventListener("click",()=>{
  showScene("exterior");
  writeSave("exterior");
});
$("#story-menu-button").addEventListener("click",()=>{
  $("#replay-chapter").disabled=scenes.find(scene=>!scene.hidden)?.dataset.scene!=="living-room";
  openPanel("#story-menu","#story-menu-button","#save-progress");
});
$("#return-home").addEventListener("click",()=>{closePanels(false);showScreen("home")});
$("#save-progress").addEventListener("click",()=>{
  const current=scenes.find(scene=>!scene.hidden)?.dataset.scene||"exterior";
  const saved=writeSave(current);
  closePanels();
  if(saved) toast("현재 위치를 저장했어.");
});
$("#bag-button").addEventListener("click",()=>openTool("bag"));
$("#diary-button").addEventListener("click",()=>openTool("diary"));
document.addEventListener("keydown",event=>{
  if(!$("#dialogue-log").hidden){
    if(event.key==="Escape"){event.preventDefault();closeDialogueLog()}
    if(event.key==="Tab"){event.preventDefault();$("#dialogue-log").focus({preventScroll:true})}
    return;
  }
  if(event.key==="Tab"){
    const panel=panelSelectors.map(selector=>$(selector)).find(node=>!node.hidden);
    if(panel){
      const buttons=[...panel.querySelectorAll("button:not(:disabled)")];
      if(!buttons.length){event.preventDefault();panel.focus({preventScroll:true});return}
      const first=buttons[0],last=buttons[buttons.length-1];
      if(first&&event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(last&&!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
    return;
  }
  if(event.key!=="Escape"||busy) return;
  closePanels();
});
renderContinue();
window.setTimeout(()=>{
  document.querySelectorAll(".scene img").forEach(img=>{
    if(typeof img.decode==="function") img.decode().catch(()=>{});
  });
},0);
})();
