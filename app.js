"use strict";

const note=document.querySelector("#menu-note");
const items=[...document.querySelectorAll(".menu-item:not(:disabled)")];

function setActive(item){
  items.forEach((button)=>button.classList.remove("is-active"));
  item.classList.add("is-active");
  items.forEach((button)=>button.setAttribute("aria-current",button===item?"true":"false"));
}

function messageFor(action){
  const messages={
    new:"새 게임 화면은 다음 단계에서 연결할 예정입니다.",
    continue:"이어하기 기능은 저장 시스템과 함께 연결할 예정입니다.",
    chapter:"챕터 선택 화면은 다음 단계에서 만들 예정입니다.",
    wardrobe:"꿈뜰이 옷장 화면은 다음 단계에서 만들 예정입니다.",
    settings:"설정 화면은 다음 단계에서 만들 예정입니다."
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

// The title menu can also be explored with the arrow keys.
items.forEach((item,index)=>item.addEventListener("keydown",(event)=>{
  if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
  event.preventDefault();
  const next=event.key==="Home"?0:event.key==="End"?items.length-1:(index+(event.key==="ArrowDown"?1:-1)+items.length)%items.length;
  items[next].focus();
}));
