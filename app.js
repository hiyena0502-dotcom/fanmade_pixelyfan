"use strict";

const note=document.querySelector("#menu-note");
const items=[...document.querySelectorAll(".menu-item:not(:disabled)")];
const credits=document.querySelector(".credits-link");

function setActive(item){
  items.forEach((button)=>button.classList.remove("is-active"));
  item.classList.add("is-active");
}

function messageFor(action){
  const messages={
    new:"새 게임 화면은 다음 단계에서 연결할 예정입니다.",
    continue:"이어하기 기능은 저장 시스템과 함께 연결할 예정입니다.",
    chapter:"챕터 선택 화면은 다음 단계에서 만들 예정입니다.",
    wardrobe:"꿈뜰이 옷장 화면은 다음 단계에서 만들 예정입니다.",
    settings:"설정 화면은 다음 단계에서 만들 예정입니다.",
    credits:"크레딧 화면은 다음 단계에서 만들 예정입니다."
  };
  return messages[action]||"";
}

items.forEach((item)=>{
  item.addEventListener("mouseenter",()=>setActive(item));
  item.addEventListener("focus",()=>setActive(item));
  item.addEventListener("click",()=>{
    if(note) note.textContent=messageFor(item.dataset.action);
  });
});

credits?.addEventListener("click",()=>{
  if(note) note.textContent=messageFor("credits");
});
