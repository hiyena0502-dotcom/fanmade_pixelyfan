(()=>{"use strict";
const SAVE_KEY="pixely-rebuild-save-v1";
const $=(q,r=document)=>r.querySelector(q);
const screens=[...document.querySelectorAll("[data-screen]")];
const scenes=[...document.querySelectorAll("[data-scene]")];
let toastTimer=0;

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
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch{return null}}
function writeSave(scene="exterior",patch={}){
  const previous=readSave()||{};
  const data={
    ...previous,
    scene,
    chapter:previous.chapterIntroSeen||scene==="living-room"?1:0,
    ...patch,
    savedAt:Date.now()
  };
  localStorage.setItem(SAVE_KEY,JSON.stringify(data));
  renderContinue();
  return data;
}
function renderContinue(){
  const save=readSave(),button=$("#continue-story"),copy=$("#continue-copy");
  button.disabled=!save;
  copy.textContent=save?(save.scene==="living-room"?"CHAPTER I · 거실":"12월 28일 · 집 앞"):"NO SAVE DATA";
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
  $("#hud-place").textContent=name==="living-room"?"픽셀리 집 · 거실":"픽셀리 집 앞";
  $("#bag-button").disabled=name!=="living-room";
  $("#diary-button").disabled=name!=="living-room";
}
function showBubble(message){
  const bubble=$("#inspect-bubble");
  bubble.textContent=message;
  bubble.hidden=false;
  clearTimeout(showBubble.timer);
  showBubble.timer=setTimeout(()=>bubble.hidden=true,2600);
}
function startStory(scene="exterior"){
  showScreen("story");
  showScene(scene);
  $("#door-choice").hidden=true;
  $("#story-menu").hidden=true;
  $("#story-dialogue-ui").hidden=true;
  $("#intro-monologue").hidden=true;
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

  frame.classList.add("intro-running");
  overlay.hidden=false;

  const render=()=>{
    text.classList.remove("is-visible");
    window.setTimeout(()=>{
      text.textContent=INTRO_LINES[index];
      requestAnimationFrame(()=>text.classList.add("is-visible"));
    },120);
  };

  const cleanup=()=>{
    overlay.removeEventListener("click",advance);
    document.removeEventListener("keydown",keyAdvance);
  };

  const finish=()=>{
    cleanup();
    text.classList.remove("is-visible");
    frame.classList.add("intro-reveal");

    window.setTimeout(()=>{
      overlay.hidden=true;
      frame.classList.remove("intro-running","intro-reveal");
    },1500);
  };

  const advance=()=>{
    if(index>=INTRO_LINES.length-1){
      finish();
      return;
    }
    index++;
    render();
  };

  const keyAdvance=event=>{
    if(event.code==="Space"||event.code==="Enter"){
      event.preventDefault();
      advance();
    }
  };

  render();
  overlay.addEventListener("click",advance);
  document.addEventListener("keydown",keyAdvance);
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
      window.setTimeout(()=>living.classList.remove("is-arriving"),250);
      return;
    }

    playChapterCard(()=>{
      writeSave("living-room",{chapter:1,chapterIntroSeen:true});
      window.setTimeout(()=>living.classList.remove("is-arriving"),250);
    });
  },790);
}

$("#new-story").addEventListener("click",()=>{
  writeSave("exterior",{chapter:0,chapterIntroSeen:false});
  runIntro();
});
$("#continue-story").addEventListener("click",()=>{
  const save=readSave();
  if(save) startStory(save.scene||"exterior");
});
$("#door-hotspot").addEventListener("click",()=>{
  $("#inspect-bubble").hidden=true;
  $("#door-choice").hidden=false;
});
$("#keep-looking").addEventListener("click",()=>{$("#door-choice").hidden=true});
$("#enter-house").addEventListener("click",enterHouse);
$("#leave-house").addEventListener("click",()=>{
  showScene("exterior");
  writeSave("exterior");
});
$("#story-menu-button").addEventListener("click",()=>{$("#story-menu").hidden=false});
$("#close-story-menu").addEventListener("click",()=>{$("#story-menu").hidden=true});
$("#return-home").addEventListener("click",()=>{$("#story-menu").hidden=true;showScreen("home")});
$("#save-progress").addEventListener("click",()=>{
  const current=scenes.find(scene=>!scene.hidden)?.dataset.scene||"exterior";
  writeSave(current);
  $("#story-menu").hidden=true;
  toast("현재 위치를 저장했어.");
});
$("#bag-button").addEventListener("click",()=>toast("가방은 아직 비어 있어."));
$("#diary-button").addEventListener("click",()=>toast("아직 적힌 내용이 없어."));
renderContinue();
})();