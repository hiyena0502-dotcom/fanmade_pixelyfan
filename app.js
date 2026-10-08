"use strict";

const items=[...document.querySelectorAll(".menu-item:not(:disabled)")];

function setActive(item){
  items.forEach((button)=>button.classList.remove("is-active"));
  item.classList.add("is-active");
  items.forEach((button)=>button.setAttribute("aria-current",button===item?"true":"false"));
}

items.forEach((item)=>{
  item.addEventListener("mouseenter",()=>setActive(item));
  item.addEventListener("focus",()=>setActive(item));
});

// The title menu can also be explored with the arrow keys.
items.forEach((item,index)=>item.addEventListener("keydown",(event)=>{
  if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
  event.preventDefault();
  const next=event.key==="Home"?0:event.key==="End"?items.length-1:(index+(event.key==="ArrowDown"?1:-1)+items.length)%items.length;
  items[next].focus();
}));
