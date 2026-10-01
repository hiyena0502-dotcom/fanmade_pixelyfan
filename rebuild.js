(()=>{"use strict";
const SAVE_KEY="pixely-rebuild-save-v1";
const $=(q,r=document)=>r.querySelector(q);
const screens=[...document.querySelectorAll("[data-screen]")];
const scenes=[...document.querySelectorAll("[data-scene]")];
let toastTimer=0;
let dialogueIndex=0;
let introCleanup=null;
let busy=false;
let activeDialogue=[];
let sessionSave;
const OPENING_DIALOGUE=[
  ["공룡","잘 왔어! 안 그래도 지금 사람 하나 필요했는데..."],
  ["라더","사람은 많은데?"],
  ["공룡","쓸 수 있는 사람이 필요하다고."],
  ["공룡","요정들한테 생일 장식을 맡겼는데, 아직 하나도 안 왔어."],
  ["덕개 · 주방에서","야, 정형준!"],
  ["공룡","집 안에 있는 요정들한테 장식 좀 받아다 줄래?"]
];

function buildHomeSnow(){
  const layer=$("#home-snow");
  if(!layer || layer.childElementCount) return;
  const fragment=document.createDocumentFragment();
  for(let i=0;i<52;i++){
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

const EXTERIOR_INSPECTIONS={
  laundry:"눈이 쌓인 빨랫줄이다. 지금은 아무것도 걸려 있지 않다.",
  birdhouse:"눈이 쌓인 작은 새집이다.",
  garden:"화단에도 눈이 소복하게 쌓여 있다."
};

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
  $("#inspect-bubble").hidden=true;
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
function showBubble(message,anchor){
  const bubble=$("#inspect-bubble");
  const x=anchor.offsetLeft+anchor.offsetWidth/2;
  const y=anchor.offsetTop;
  const stage=anchor.parentElement;
  const width=Math.min(380,stage.clientWidth*.85);
  const margin=width/2+8;
  bubble.style.setProperty("--bubble-x",Math.min(Math.max(x,margin),Math.max(margin,stage.clientWidth-margin))+"px");
  bubble.style.setProperty("--bubble-y",Math.max(42,y-8)+"px");
  bubble.textContent=message;
  bubble.hidden=false;
  clearTimeout(showBubble.timer);
  showBubble.timer=setTimeout(()=>bubble.hidden=true,2600);
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
function startStory(scene="exterior"){
  introCleanup?.();
  introCleanup=null;
  setBusy(false);
  scene=normalizeStoryScene(scene);
  showScreen("story");
  showScene(scene);
  $("#door-choice").hidden=true;
  $("#story-menu").hidden=true;
  $("#story-dialogue-ui").hidden=true;
  $("#intro-monologue").hidden=true;
  $("#tool-sheet").hidden=true;
  if(scene==="living-room"&&!readSave()?.openingSeen) beginOpeningDialogue();
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
    },1500);
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
function playChapterCard(after){
  const card=$("#chapter-card");
  const frame=$(".story-frame");
  frame.classList.add("chapter-playing");
  card.hidden=false;
  card.classList.remove("is-active","is-leaving");

  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>card.classList.add("is-active"));
  });

  window.setTimeout(()=>card.classList.add("is-leaving"),2850);
  window.setTimeout(()=>{
    card.hidden=true;
    card.classList.remove("is-active","is-leaving");
    frame.classList.remove("chapter-playing");
    after?.();
  },3650);
}

function enterHouse(){
  if(busy) return;
  setBusy(true);
  $("#door-choice").hidden=true;
  const frame=$(".story-frame");
  const transition=$("#house-entry-transition");
  const living=$('[data-scene="living-room"]');

  $("#door-choice").hidden=true;
  frame.classList.add("house-entering");

  transition.hidden=false;
  transition.classList.remove("is-active");
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>transition.classList.add("is-active"));
  });

  window.setTimeout(()=>{
    showScene("living-room");
    living.classList.add("is-arriving");
  },420);

  window.setTimeout(()=>{
    transition.hidden=true;
    transition.classList.remove("is-active");
    frame.classList.remove("house-entering");
  },720);

  window.setTimeout(()=>{
    const save=readSave();
    const chapterAlreadyPlayed=Boolean(save?.chapterIntroSeen);

    if(chapterAlreadyPlayed){
      writeSave("living-room",{chapter:1,chapterIntroSeen:true});
      setBusy(false);
      if(!save?.openingSeen) beginOpeningDialogue();
      window.setTimeout(()=>living.classList.remove("is-arriving"),250);
      return;
    }

    playChapterCard(()=>{
      writeSave("living-room",{chapter:1,chapterIntroSeen:true});
      setBusy(false);
      beginOpeningDialogue();
      window.setTimeout(()=>living.classList.remove("is-arriving"),250);
    });
  },790);
}

function beginOpeningDialogue(){
  activeDialogue=OPENING_DIALOGUE;
  dialogueIndex=0;
  setBusy(true);
  $("#story-dialogue-ui").hidden=false;
  renderDialogue();
  $("#dialogue-next").focus({preventScroll:true});
}
function renderDialogue(){
  const [speaker,line]=activeDialogue[dialogueIndex];
  $("#dialogue-speaker").textContent=speaker;
  $("#dialogue-text").textContent=line;
  $("#dialogue-next").setAttribute("aria-label",dialogueIndex===activeDialogue.length-1?"대화 마치기":"다음 대사");
}
$("#dialogue-next").addEventListener("click",()=>{
  if(++dialogueIndex<activeDialogue.length){renderDialogue();return}
  $("#story-dialogue-ui").hidden=true;
  setBusy(false);
  writeSave("living-room",{openingSeen:true,decorationQuest:"accepted"});
  $("#talk-gongryong").focus({preventScroll:true});
});
$("#talk-gongryong").addEventListener("click",beginOpeningDialogue);
function openTool(kind){
  const sheet=$("#tool-sheet"),content=$("#tool-content"),save=readSave();
  $("#story-menu").hidden=true;
  sheet.className="tool-sheet tool-sheet--"+kind;
  $("#tool-title").textContent=kind==="bag"?"꿈뜰이의 가방":"꿈뜰이의 기록장";
  content.replaceChildren();
  const paragraph=document.createElement("p");
  paragraph.textContent=kind==="bag"?"가방이 비어 있다.":save?.decorationQuest==="accepted"?"12월 28일 · 생일 준비\n공룡이 요정들에게 맡긴 생일 장식을 받아다 달라고 부탁했다.":"12월 28일. 잠뜰님의 생일을 축하하러 픽셀리 집에 왔다.";
  content.appendChild(paragraph);
  sheet.hidden=false;
  $("#close-tool-sheet").focus();
}
function closeTool(){
  const bag=$("#tool-sheet").classList.contains("tool-sheet--bag");
  $("#tool-sheet").hidden=true;
  $(bag?"#bag-button":"#diary-button").focus();
}
$("#close-tool-sheet").addEventListener("click",closeTool);

$("#new-story").addEventListener("click",()=>{
  writeSave("exterior",{chapter:0,chapterIntroSeen:false,openingSeen:false,decorationQuest:null});
  runIntro();
});
$("#continue-story").addEventListener("click",()=>{
  const save=readSave();
  if(save) startStory(save.scene||"exterior");
});
document.querySelectorAll("[data-inspect]").forEach(button=>{
  button.addEventListener("click",()=>{
    const message=EXTERIOR_INSPECTIONS[button.dataset.inspect];
    if(message) showBubble(message,button);
  });
});

$("#door-hotspot").addEventListener("click",()=>{
  $("#inspect-bubble").hidden=true;
  $("#door-choice").hidden=true;
  showScene("door-closeup");
  writeSave("door-closeup");
  $("#door-closeup-hotspot").focus({preventScroll:true});
});
$("#door-closeup-hotspot").addEventListener("click",()=>{
  $("#door-choice").hidden=false;
  $("#enter-house").focus({preventScroll:true});
});
$("#door-closeup-back").addEventListener("click",()=>{
  $("#door-choice").hidden=true;
  showScene("exterior");
  writeSave("exterior");
  $("#door-hotspot").focus({preventScroll:true});
});
$("#keep-looking").addEventListener("click",()=>{
  $("#door-choice").hidden=true;
  $("#door-closeup-hotspot").focus({preventScroll:true});
});
$("#enter-house").addEventListener("click",enterHouse);
$("#leave-house").addEventListener("click",()=>{
  showScene("exterior");
  writeSave("exterior");
});
$("#story-menu-button").addEventListener("click",()=>{
  $("#tool-sheet").hidden=true;$("#door-choice").hidden=true;
  $("#story-menu").hidden=false;$("#close-story-menu").focus();
});
$("#close-story-menu").addEventListener("click",()=>{$("#story-menu").hidden=true});
$("#return-home").addEventListener("click",()=>{$("#story-menu").hidden=true;showScreen("home")});
$("#save-progress").addEventListener("click",()=>{
  const current=scenes.find(scene=>!scene.hidden)?.dataset.scene||"exterior";
  const saved=writeSave(current);
  $("#story-menu").hidden=true;
  if(saved) toast("현재 위치를 저장했어.");
});
$("#bag-button").addEventListener("click",()=>openTool("bag"));
$("#diary-button").addEventListener("click",()=>openTool("diary"));
document.addEventListener("keydown",event=>{
  if(event.key!=="Escape"||busy) return;
  if(!$("#tool-sheet").hidden){closeTool();return}
  if(!$("#door-choice").hidden){$("#keep-looking").click();return}
  if(!$("#story-menu").hidden){$("#story-menu").hidden=true;$("#story-menu-button").focus()}
});
renderContinue();
})();
