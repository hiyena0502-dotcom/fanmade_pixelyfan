"use strict";

const note=document.querySelector("#menu-note");
const items=[...document.querySelectorAll(".menu-item")];

function setActive(item){
  items.forEach((button)=>button.classList.remove("is-active"));
  item.classList.add("is-active");
}

items.forEach((item)=>{
  item.addEventListener("mouseenter",()=>setActive(item));
  item.addEventListener("focus",()=>setActive(item));
  item.addEventListener("click",()=>{
    if(!note)return;
    const label=item.dataset.placeholder||item.textContent.trim();
    note.textContent=`${label} 기능은 다음 단계에서 연결할 예정입니다.`;
  });
});
