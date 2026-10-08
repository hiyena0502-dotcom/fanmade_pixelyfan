"use strict";

const house=document.querySelector(".layer-house");
const houseTouch=document.querySelector(".house-touch");
let houseReaction;
houseTouch?.addEventListener("click",()=>{
  houseReaction?.cancel();
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  houseReaction=house.animate(reduced?[
    {filter:"brightness(1)"},{filter:"brightness(1.08)"},{filter:"brightness(1)"}
  ]:[
    {transform:"translateY(0) rotate(0deg) scale(1)"},
    {transform:"translateY(.3%) rotate(-.7deg) scale(1.008,.99)",offset:.2},
    {transform:"translateY(-.25%) rotate(.6deg) scale(.998,1.004)",offset:.45},
    {transform:"translateY(.1%) rotate(-.3deg) scale(1)",offset:.7},
    {transform:"translateY(0) rotate(0deg) scale(1)"}
  ],{duration:reduced?250:480,easing:"ease-out"});
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

// A light wind pushes left while gravity and air resistance pull leaves down.
const breeze=document.querySelector(".leaf-breeze");
if(breeze){
  const greens=["#4f8b58","#669b50","#7fa95d","#a4bb70","#397e63","#6aa878"];
  const shapes=["M5 25C2 13 15 5 29 4C27 18 20 30 5 25Z","M5 25C4 10 20 3 29 4C30 18 16 32 5 25Z","M5 25C1 16 12 6 29 4C24 19 16 29 5 25Z"];
  const random=(min,max)=>min+Math.random()*(max-min);
  const motionPreference=matchMedia("(prefers-reduced-motion: reduce)");
  let width=breeze.clientWidth,height=breeze.clientHeight;
  let frame=0,lastTime=0,windTime=0;
  const leaves=[];

  function spawn(leaf){
    leaf.size=random(32,48)*Math.max(.75,Math.min(1.15,width/1920));
    leaf.x=width+leaf.size+random(0,width*.12);
    leaf.y=random(-leaf.size,height*.48);
    leaf.vx=-random(85,150)*width/1920;
    leaf.vy=random(10,25)*height/911;
    leaf.phase=random(0,Math.PI*2);
    leaf.flutter=random(1.2,2.3);
    leaf.angle=random(0,360);
    leaf.turn=random(-50,50);
    leaf.age=0;
    leaf.element.style.width=`${leaf.size}px`;
    leaf.element.style.height=`${leaf.size}px`;
    leaf.element.style.setProperty("--leaf-color",greens[Math.floor(random(0,greens.length))]);
    leaf.element.style.opacity=random(.88,.98);
  }

  function advance(leaf,dt,time){
    leaf.age+=dt;
    const gust=Math.sin(time*.62+leaf.phase)*.24+Math.sin(time*1.13+leaf.phase)*.1;
    const flutter=motionPreference.matches?0:Math.sin(leaf.age*leaf.flutter+leaf.phase);
    // Drag limits the falling speed; gusts and flutter change each trajectory.
    leaf.vy+=(16*height/911-leaf.vy*.26)*dt;
    leaf.x+=(leaf.vx*(1+gust)+flutter*13*width/1920)*dt;
    leaf.y+=(leaf.vy+flutter*12*height/911)*dt;
    leaf.angle+=(leaf.turn+flutter*22)*dt;
    if(leaf.x < -leaf.size*2 || leaf.y > height+leaf.size*2) spawn(leaf);
  }

  function render(leaf){
    leaf.element.style.transform=`translate3d(${leaf.x.toFixed(2)}px,${leaf.y.toFixed(2)}px,0)`;
    const flip=motionPreference.matches?1:.72+Math.sin(leaf.age*1.7+leaf.phase)*.25;
    leaf.blade.style.transform=`rotate(${leaf.angle.toFixed(2)}deg) scaleX(${flip.toFixed(3)})`;
  }

  for(let i=0;i<8;i++){
    const element=document.createElement("span");
    element.className="drifting-leaf";
    element.innerHTML=`<svg class="leaf-blade" viewBox="0 0 34 34" focusable="false"><path fill="currentColor" d="${shapes[i%shapes.length]}"/><path class="leaf-vein" d="M3 29 23 10M11 21l-1-7m6 2 7 0"/></svg>`;
    breeze.append(element);
    const leaf={element,blade:element.firstElementChild};
    spawn(leaf);
    // Start at different points in an ongoing breeze instead of one big wave.
    const warmup=random(2,17);
    for(let t=0;t<warmup;t+=1/30) advance(leaf,1/30,t);
    render(leaf);
    leaves.push(leaf);
  }

  function animate(time){
    const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;
    lastTime=time;
    const step=dt*(motionPreference.matches ? .35 : 1);
    windTime+=step;
    leaves.forEach(leaf=>{advance(leaf,step,windTime);render(leaf);});
    frame=requestAnimationFrame(animate);
  }

  function syncVisibility(){
    cancelAnimationFrame(frame);
    lastTime=0;
    if(!document.hidden) frame=requestAnimationFrame(animate);
  }
  addEventListener("resize",()=>{width=breeze.clientWidth;height=breeze.clientHeight;});
  document.addEventListener("visibilitychange",syncVisibility);
  syncVisibility();
}
