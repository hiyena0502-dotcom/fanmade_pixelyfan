"use strict";

const house=document.querySelector(".layer-house");
const houseTouch=document.querySelector(".house-touch");
const sign=document.querySelector(".door-sign");
let houseReaction,signReaction;
houseTouch?.addEventListener("click",()=>{
  void window.PixelySettings.playEffect("house");
  if(!window.PixelySettings.get().motion) return;
  houseReaction?.cancel();
  signReaction?.cancel();
  // A shallow press, one crisp hop, then a small landing recoil.
  houseReaction=house.animate([
    {transform:"translateY(0) scale(1)",easing:"ease-out"},
    {transform:"translateY(.15%) scale(1.025,.955)",offset:.16},
    {transform:"translateY(.15%) scale(1.025,.955)",offset:.22,easing:"cubic-bezier(.12,.72,.25,1)"},
    {transform:"translateY(-1.85%) scale(.99,1.025)",offset:.43,easing:"ease-in"},
    {transform:"translateY(0) scale(1.018,.977)",offset:.7,easing:"ease-out"},
    {transform:"translateY(-.22%) scale(.997,1.005)",offset:.86},
    {transform:"translateY(0) scale(1)"}
  ],{duration:780,easing:"ease-in-out"});
  signReaction=sign.animate([
    {transform:"rotate(0deg)",offset:0},{transform:"rotate(-12deg)",offset:.2},
    {transform:"rotate(9deg)",offset:.43},{transform:"rotate(-6deg)",offset:.63},
    {transform:"rotate(3.5deg)",offset:.8},{transform:"rotate(-1.5deg)",offset:.92},
    {transform:"rotate(0deg)"}
  ],{duration:2200,easing:"ease-in-out",composite:"add"});
});

const bush=document.querySelector(".bush-art");
const bushTouch=document.querySelector(".bush-touch");
const bushLeaves=document.querySelector(".bush-leaves");
let bushReaction;
bushTouch?.addEventListener("click",()=>{
  void window.PixelySettings.playEffect("bush");
  if(!window.PixelySettings.get().motion) return;
  bushReaction?.cancel();
  bushLeaves.querySelectorAll(".bush-leaf").forEach(leaf=>leaf.getAnimations().forEach(animation=>animation.cancel()));
  bushLeaves.replaceChildren();
  bushReaction=bush.animate([
    {transform:"rotate(0deg)"},
    {transform:"translateY(.3%) scale(1.045,.94) rotate(-1.2deg)",offset:.08},
    {transform:"translateX(-.28%) rotate(-4.8deg) skewX(-3deg) scale(.98,1.035)",offset:.19},
    {transform:"translateX(.35%) rotate(5deg) skewX(3.5deg) scale(1.025,.975)",offset:.31},
    {transform:"translateX(-.2%) rotate(-3.8deg) skewX(-2.5deg)",offset:.43},
    {transform:"translateX(.15%) rotate(3deg) skewX(1.8deg)",offset:.55},
    {transform:"rotate(-2.2deg) scale(1.015,.985)",offset:.65},
    {transform:"rotate(1.5deg)",offset:.74},
    {transform:"rotate(-.9deg)",offset:.82},
    {transform:"rotate(.45deg)",offset:.9},
    {transform:"rotate(0deg)"}
  ],{duration:1350,easing:"ease-in-out"});
  const greens=["#397e63","#4f8b58","#7fa95d","#a4bb70"];
  const scale=bushLeaves.clientWidth/278;
  for(let i=0;i<8;i++){
    const leaf=document.createElement("span");
    leaf.className="bush-leaf";
    leaf.style.left=`${12+Math.random()*75}%`;
    leaf.style.top=`${16+Math.random()*42}%`;
    leaf.style.width=`${(16+Math.random()*10)*scale}px`;
    leaf.style.color=greens[i%greens.length];
    leaf.innerHTML='<svg viewBox="0 0 34 34"><path d="M5 25C2 13 15 5 29 4C27 18 20 30 5 25Z"/></svg>';
    bushLeaves.append(leaf);
    const duration=1.65+Math.random()*.65;
    const vx=(Math.random()-.65)*145*scale;
    const vy=-(75+Math.random()*65)*scale;
    const gravity=(170+Math.random()*65)*scale;
    const angle=Math.random()*100-50;
    const turn=(Math.random()-.5)*330;
    const phase=Math.random()*Math.PI*2;
    const keyframes=Array.from({length:19},(_,frame)=>{
      const progress=frame/18,t=progress*duration;
      const x=vx*t+Math.sin(t*5+phase)*9*scale*progress;
      const y=vy*t+.5*gravity*t*t;
      const flip=Math.cos(t*3+phase);
      return {offset:progress,opacity:Math.min(1,progress*9,(1-progress)*5),transform:`translate(${x}px,${y}px) rotate(${angle+turn*progress}deg) scaleX(${flip})`};
    });
    const animation=leaf.animate(keyframes,{duration:duration*1000,delay:30+Math.random()*360,easing:"linear",fill:"forwards"});
    animation.addEventListener("finish",()=>leaf.remove(),{once:true});
  }
});

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

// The same leaf shapes, gusts, gravity and flutter are shared with gameplay.
const breeze=document.querySelector('.leaf-breeze');
if(breeze)PixelyLeafBreeze.create(breeze,{enabled:()=>PixelySettings.get().motion});

addEventListener("pixely:settingschange",event=>{
  if(!event.detail.motion){
    houseReaction?.cancel();signReaction?.cancel();bushReaction?.cancel();
    bushLeaves.querySelectorAll(".bush-leaf").forEach(leaf=>leaf.getAnimations().forEach(animation=>animation.cancel()));
    bushLeaves.replaceChildren();
  }
});

// Open the dedicated wardrobe scene without affecting the title screen.
document.querySelector('[data-action="wardrobe"]')?.addEventListener('click',()=>{window.location.href='./wardrobe.html';});
document.querySelector('[data-action="chapter"]')?.addEventListener('click',()=>{window.location.href='./chapters.html';});
document.querySelector('[data-action="collection"]')?.addEventListener('click',()=>{window.location.href='./collection.html';});

document.querySelector('[data-action="new"]')?.addEventListener('click',()=>{location.href='./game.html?mode=new&ui=menu-sync-31';});
document.querySelector('[data-action="continue"]')?.addEventListener('click',()=>{location.href='./game.html?mode=continue&ui=menu-sync-31';});
