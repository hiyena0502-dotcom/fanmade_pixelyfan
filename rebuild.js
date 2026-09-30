(()=>{"use strict";
const SAVE_KEY="pixely-rebuild-save-v1";
const $=(q,r=document)=>r.querySelector(q);
const screens=[...document.querySelectorAll("[data-screen]")];
const scenes=[...document.querySelectorAll("[data-scene]")];
let toastTimer=0;
function toast(message){const node=$("#toast");node.textContent=message;node.classList.add("is-visible");clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove("is-visible"),1700)}
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||"null")}catch{return null}}
function writeSave(scene="exterior"){const data={scene,chapter:scene==="living-room"?1:0,savedAt:Date.now()};localStorage.setItem(SAVE_KEY,JSON.stringify(data));renderContinue();return data}
function renderContinue(){const save=readSave(),button=$("#continue-story"),copy=$("#continue-copy");button.disabled=!save;copy.textContent=save?(save.scene==="living-room"?"CHAPTER 1 · 거실":"12월 28일 · 픽셀리 집 앞"):"저장된 이야기가 없습니다"}
function showScreen(name){screens.forEach(screen=>{const on=screen.dataset.screen===name;screen.hidden=!on;screen.classList.toggle("is-active",on)})}
function showScene(name){scenes.forEach(scene=>{const on=scene.dataset.scene===name;scene.hidden=!on;scene.classList.toggle("is-active",on)});$("#hud-place").textContent=name==="living-room"?"픽셀리 집 · 거실":"픽셀리 집 앞";$("#bag-button").disabled=name!=="living-room";$("#diary-button").disabled=name!=="living-room"}
function showBubble(message){const bubble=$("#inspect-bubble");bubble.textContent=message;bubble.hidden=false;clearTimeout(showBubble.timer);showBubble.timer=setTimeout(()=>bubble.hidden=true,2600)}
function startStory(scene="exterior"){showScreen("story");showScene(scene);$("#door-choice").hidden=true;$("#story-menu").hidden=true}
$("#new-story").addEventListener("click",()=>{writeSave("exterior");startStory("exterior")});
$("#continue-story").addEventListener("click",()=>{const save=readSave();if(save)startStory(save.scene||"exterior")});
$("#village-hotspot").addEventListener("click",()=>showBubble("저쪽은 팀샐러드 마을의 첨탑이다. 지금은 잠뜰님의 생일을 준비해야지."));
$("#taeppeu-arrow").addEventListener("click",()=>showBubble("오른쪽 길도 이어져 있다. 지금은 잠뜰님의 생일을 준비해야지."));
$("#door-hotspot").addEventListener("click",()=>{$("#inspect-bubble").hidden=true;$("#door-choice").hidden=false});
$("#keep-looking").addEventListener("click",()=>{$("#door-choice").hidden=true;showBubble("조금 더 둘러보기로 했다.")});
$("#enter-house").addEventListener("click",()=>{$("#door-choice").hidden=true;const card=$("#chapter-card");card.hidden=false;setTimeout(()=>{card.hidden=true;showScene("living-room");writeSave("living-room")},1450)});
$("#story-menu-button").addEventListener("click",()=>{$("#story-menu").hidden=false});
$("#close-story-menu").addEventListener("click",()=>{$("#story-menu").hidden=true});
$("#return-home").addEventListener("click",()=>{$("#story-menu").hidden=true;showScreen("home")});
$("#save-progress").addEventListener("click",()=>{const current=scenes.find(scene=>!scene.hidden)?.dataset.scene||"exterior";writeSave(current);$("#story-menu").hidden=true;toast("현재 위치를 저장했어.")});
$("#bag-button").addEventListener("click",()=>toast("가방 UI는 새 디자인으로 연결 예정."));
$("#diary-button").addEventListener("click",()=>toast("다이어리 UI는 새 디자인으로 연결 예정."));
renderContinue();
})();