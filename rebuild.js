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
const panelSelectors=["#tool-sheet","#story-menu","#door-choice"];

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

/* 독백 대사는 사용자와 함께 확정한 뒤 이 배열에 넣는다. */
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
    chapter:previous.chapterIntroSeen||scene==="living-room"?1:0,
    ...patch,
    savedAt:Date.now()
  };
  sessionSave=data;
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data))}
  catch{renderContinue();toast("이번 진행은 현재 탭에서만 유지돼. 브라우저 저장 공간을 사용할 수 없어.");return null}
  renderContinue();
  return data;
}
function renderContinue(){
  const save=readSave(),button=$("#continue-story"),copy=$("#continue-copy");
  button.disabled=!save;
  const labels={"exterior":"12월 28일 · 집 앞","door-closeup":"12월 28일 · 문 앞","living-room":"CHAPTER I · 거실"};
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
    :name==="door-closeup"
      ?"픽셀리 집 · 문 앞"
      :"픽셀리 집 앞";
  $("#hud-place").textContent=placeLabel;
  if(name!=="door-closeup") $("#door-choice").hidden=true;
  $("#bag-button").disabled=name!=="living-room";
  $("#diary-button").disabled=name!=="living-room";
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
  $("#intro-monologue").hidden=true;
  if(scene==="living-room"&&(readSave()?.dialogueProgress||!readSave()?.openingSeen)) beginGongryongDialogue();
}
function runIntro(){
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
      setBusy(false);
      $("#door-hotspot").focus({preventScroll:true});
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
  window.setTimeout(()=>showScene("living-room"),180);
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
  },340);
}

function beginGongryongDialogue(){
  if(busy) return;
  closePanels(false);
  setBusy(true);
  const save=readSave();
  window.PixelyDialogue.open({
    saved:save?.dialogueProgress,
    repeat:Boolean(save?.openingSeen),
    progress:dialogueProgress=>writeSave("living-room",{dialogueProgress}),
    complete:()=>{
      const newlyAccepted=readSave()?.decorationQuest!=="accepted";
      writeSave("living-room",{openingSeen:true,dialogueProgress:null,decorationQuest:"accepted"});
      setBusy(false);
      $("#talk-gongryong").focus({preventScroll:true});
      if(newlyAccepted) toast("공룡에게 부탁받은 생일 장식 찾기");
    }
  });
}
$("#talk-gongryong").addEventListener("click",beginGongryongDialogue);

function openTool(kind){
  const sheet=$("#tool-sheet"),content=$("#tool-content");
  sheet.className="tool-sheet tool-sheet--"+kind;
  $("#tool-title").textContent=kind==="bag"?"꿈뜰이의 가방":"꿈뜰이의 기록장";
  content.replaceChildren();
  const paragraph=document.createElement("p");
  paragraph.textContent=kind==="bag"?"가방이 비어 있다.":readSave()?.decorationQuest==="accepted"?"공룡에게 부탁받은 생일 장식 찾기":"아직 적힌 내용이 없다.";
  content.appendChild(paragraph);
  openPanel("#tool-sheet",kind==="bag"?"#bag-button":"#diary-button");
}
$("#new-story").addEventListener("click",()=>{
  writeSave("exterior",{chapter:0,chapterIntroSeen:false,openingSeen:false,dialogueProgress:null,decorationQuest:null});
  runIntro();
});
$("#continue-story").addEventListener("click",()=>{
  const save=readSave();
  if(save) startStory(save.scene||"exterior");
});
$("#door-hotspot").addEventListener("click",()=>{
  closePanels(false);
  showScene("door-closeup");
  writeSave("door-closeup");
  $("#door-closeup-hotspot").focus({preventScroll:true});
});
$("#door-closeup-hotspot").addEventListener("click",()=>{
  openPanel("#door-choice","#door-closeup-hotspot","#enter-house");
});
$("#door-closeup-back").addEventListener("click",()=>{
  closePanels(false);
  showScene("exterior");
  writeSave("exterior");
  $("#door-hotspot").focus({preventScroll:true});
});
$("#keep-looking").addEventListener("click",()=>{
  closePanels();
});
$("#enter-house").addEventListener("click",enterHouse);
$("#leave-house").addEventListener("click",()=>{
  showScene("exterior");
  writeSave("exterior");
});
$("#story-menu-button").addEventListener("click",()=>{
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
