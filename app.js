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

// Separate travel, sway, and tumble keep each leaf moving like a light gust.
const breeze=document.querySelector(".leaf-breeze");
if(breeze){
  const greens=["#4f8b58","#669b50","#7fa95d","#a4bb70","#397e63","#6aa878"];
  const shapes=["M5 25C2 13 15 5 29 4C27 18 20 30 5 25Z","M5 25C4 10 20 3 29 4C30 18 16 32 5 25Z","M5 25C1 16 12 6 29 4C24 19 16 29 5 25Z"];
  const leaves=document.createDocumentFragment();
  for(let i=0;i<18;i++){
    const leaf=document.createElement("span");
    const duration=16+(i*7%13);
    leaf.className="drifting-leaf";
    const settings={
      "--leaf-top":`${-5+(i*37%97)}%`,
      "--leaf-size":`clamp(12px,${(0.85+(i*3%9)*0.12).toFixed(2)}vw,31px)`,
      "--leaf-color":greens[i%greens.length],
      "--leaf-opacity":`${0.64+(i%4)*0.09}`,
      "--leaf-duration":`${duration}s`,
      "--leaf-delay":`${-(i*0.618%1)*duration}s`,
      "--leaf-drift":`${-14+(i*11%33)}vh`,
      "--sway-height":`${12+(i*7%29)}px`,
      "--sway-duration":`${3.1+(i*3%8)*0.43}s`,
      "--sway-delay":`${-i*0.7}s`,
      "--turn-duration":`${4.5+(i*5%11)*0.48}s`,
      "--leaf-angle":`${i*47%360}deg`
    };
    Object.entries(settings).forEach(([name,value])=>leaf.style.setProperty(name,value));
    leaf.innerHTML=`<span class="leaf-sway"><svg class="leaf-blade" viewBox="0 0 34 34" focusable="false"><path fill="currentColor" d="${shapes[i%shapes.length]}"/><path class="leaf-vein" d="M3 29 23 10M11 21l-1-7m6 2 7 0"/></svg></span>`;
    leaves.append(leaf);
  }
  breeze.append(leaves);
  const pauseBreeze=()=>breeze.classList.toggle("is-paused",document.hidden);
  document.addEventListener("visibilitychange",pauseBreeze);
  pauseBreeze();
}
