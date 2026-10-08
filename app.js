"use strict";

const house=document.querySelector(".layer-house");
const houseTouch=document.querySelector(".house-touch");
const sign=document.querySelector(".door-sign");
let houseReaction,signReaction;
const reducedMotion=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
houseTouch?.addEventListener("click",()=>{
  void window.PixelySettings.playEffect("house");
  if(!window.PixelySettings.get().motion) return;
  houseReaction?.cancel();
  signReaction?.cancel();
  const calm=reducedMotion();
  // A shallow press, one crisp hop, then a small landing recoil.
  houseReaction=house.animate(calm?[
    {transform:"translateY(0) scale(1)"},
    {transform:"translateY(.1%) scale(1.01,.98)",offset:.25},
    {transform:"translateY(-.6%) scale(1)",offset:.55},
    {transform:"translateY(0) scale(1)"}
  ]:[
    {transform:"translateY(0) scale(1)",easing:"ease-out"},
    {transform:"translateY(.15%) scale(1.025,.955)",offset:.16},
    {transform:"translateY(.15%) scale(1.025,.955)",offset:.22,easing:"cubic-bezier(.12,.72,.25,1)"},
    {transform:"translateY(-1.85%) scale(.99,1.025)",offset:.43,easing:"ease-in"},
    {transform:"translateY(0) scale(1.018,.977)",offset:.7,easing:"ease-out"},
    {transform:"translateY(-.22%) scale(.997,1.005)",offset:.86},
    {transform:"translateY(0) scale(1)"}
  ],{duration:calm?360:780,easing:"ease-in-out"});
  signReaction=sign.animate(calm?[{transform:"rotate(0deg)"},{transform:"rotate(2deg)"},{transform:"rotate(0deg)"}]:[
    {transform:"rotate(0deg)",offset:0},{transform:"rotate(-18deg)",offset:.2},
    {transform:"rotate(14deg)",offset:.43},{transform:"rotate(-9deg)",offset:.63},
    {transform:"rotate(5deg)",offset:.8},{transform:"rotate(-2deg)",offset:.92},
    {transform:"rotate(0deg)"}
  ],{duration:calm?320:2200,easing:"ease-in-out",composite:"add"});
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
  const calm=reducedMotion();
  bushReaction=bush.animate(calm?[{transform:"rotate(0deg)"},{transform:"rotate(-1deg)"},{transform:"rotate(1deg)"},{transform:"rotate(0deg)"}]:[
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
  ],{duration:calm?320:1350,easing:"ease-in-out"});
  const greens=["#397e63","#4f8b58","#7fa95d","#a4bb70"];
  const scale=bushLeaves.clientWidth/278;
  for(let i=0;i<(calm?3:8);i++){
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
      const flip=calm?1:Math.cos(t*3+phase);
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

// Sparse leaves enter from different points, with independent gusts and gravity.
const breeze=document.querySelector(".leaf-breeze");
if(breeze){
  const greens=["#4f8b58","#669b50","#7fa95d","#a4bb70","#397e63","#6aa878"];
  const shapes=["M5 25C2 13 15 5 29 4C27 18 20 30 5 25Z","M5 25C4 10 20 3 29 4C30 18 16 32 5 25Z","M5 25C1 16 12 6 29 4C24 19 16 29 5 25Z"];
  const random=(min,max)=>min+Math.random()*(max-min);
  const motionPreference=matchMedia("(prefers-reduced-motion: reduce)");
  let width=breeze.clientWidth,height=breeze.clientHeight;
  let frame=0,lastTime=0,windTime=0,nextEmission=random(3,6);
  const leaves=[];

  function spawn(leaf,initialX){
    const fromTop=Math.random()<.55;
    const x=initialX===undefined?(fromTop?random(width*.3,width*1.08):width+40):initialX;
    const y=initialX===undefined?(fromTop?-40:random(-40,height*.62)):random(height*.04,height*.36);
    // Do not release two leaves close together at the edge.
    if(initialX===undefined&&leaves.some(other=>other.active&&Math.hypot((other.x-x)/width,(other.y-y)/height)<.18)) return false;
    leaf.active=true;
    leaf.size=random(21,35)*Math.max(.75,Math.min(1.15,width/1920));
    leaf.x=x;leaf.y=y;
    leaf.vx=-random(.052,.108)*width;
    leaf.wind=leaf.vx;
    leaf.vy=random(8,26)*height/911;
    leaf.gravity=random(13,25)*height/911;
    leaf.drag=random(.22,.38);
    leaf.phase=random(0,Math.PI*2);
    leaf.flutter=random(1.05,2.9);
    leaf.sway=random(9,28);
    leaf.angle=random(0,360);
    leaf.turn=random(35,95)*(Math.random()<.5?-1:1);
    leaf.flipSpeed=random(1.15,2.55);
    leaf.age=0;
    leaf.opacity=random(.8,.96);
    leaf.element.style.display="block";
    leaf.element.style.width=`${leaf.size}px`;
    leaf.element.style.height=`${leaf.size}px`;
    leaf.element.style.setProperty("--leaf-color",greens[Math.floor(random(0,greens.length))]);
    render(leaf);
    return true;
  }

  function advance(leaf,dt,time){
    if(!leaf.active) return;
    leaf.age+=dt;
    const gust=Math.sin(time*.47+leaf.phase)*.3+Math.sin(time*1.07+leaf.phase)*.15;
    const flutter=motionPreference.matches?0:Math.sin(leaf.age*leaf.flutter+leaf.phase);
    leaf.vx+=(leaf.wind*(1+gust)-leaf.vx)*dt*.7;
    leaf.vy+=(leaf.gravity-leaf.vy*leaf.drag)*dt;
    leaf.x+=(leaf.vx+flutter*leaf.sway*width/1920)*dt;
    leaf.y+=(leaf.vy+flutter*13*height/911)*dt;
    leaf.angle+=(leaf.turn+flutter*35)*dt;
    if(leaf.x < -leaf.size*3 || leaf.y > height+leaf.size*3){
      leaf.active=false;
      leaf.element.style.display="none";
    }
  }

  function render(leaf){
    if(!leaf.active) return;
    leaf.element.style.opacity=leaf.opacity*Math.min(1,leaf.age/.65);
    leaf.element.style.transform=`translate3d(${leaf.x.toFixed(2)}px,${leaf.y.toFixed(2)}px,0)`;
    const flip=motionPreference.matches?1:Math.cos(leaf.age*leaf.flipSpeed+leaf.phase);
    leaf.blade.style.transform=`rotate(${leaf.angle.toFixed(2)}deg) scaleX(${flip.toFixed(3)}) scaleY(.72)`;
  }

  for(let i=0;i<5;i++){
    const element=document.createElement("span");
    element.className="drifting-leaf";
    element.style.display="none";
    element.innerHTML=`<svg class="leaf-blade" viewBox="0 0 34 34" focusable="false"><path fill="currentColor" d="${shapes[i%shapes.length]}"/><path class="leaf-vein" d="M3 29 23 10M11 21l-1-7m6 2 7 0"/></svg>`;
    breeze.append(element);
    const leaf={element,blade:element.firstElementChild,active:false};
    leaves.push(leaf);
    // Three widely spaced leaves make the initial breeze visible without a wave.
    if(i<3){spawn(leaf,width*(.22+i*.33+random(-.045,.045)));leaf.age=random(1,4);render(leaf);}
  }

  function animate(time){
    const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;
    lastTime=time;
    const step=dt*(motionPreference.matches ? .35 : 1);
    windTime+=step;
    leaves.forEach(leaf=>{advance(leaf,step,windTime);render(leaf);});
    if(windTime>=nextEmission){
      const available=leaves.find(leaf=>!leaf.active);
      if(available) spawn(available);
      nextEmission=windTime+random(3,6);
    }
    frame=requestAnimationFrame(animate);
  }

  function syncVisibility(){
    cancelAnimationFrame(frame);
    lastTime=0;
    if(!document.hidden&&window.PixelySettings.get().motion) frame=requestAnimationFrame(animate);
  }
  addEventListener("resize",()=>{
    const previousWidth=width,previousHeight=height;
    width=breeze.clientWidth;height=breeze.clientHeight;
    leaves.filter(leaf=>leaf.active).forEach(leaf=>{
      leaf.x*=width/previousWidth;leaf.y*=height/previousHeight;
      leaf.wind*=width/previousWidth;leaf.vx*=width/previousWidth;
      leaf.vy*=height/previousHeight;leaf.gravity*=height/previousHeight;
    });
  });
  addEventListener("pixely:settingschange",syncVisibility);
  document.addEventListener("visibilitychange",syncVisibility);
  syncVisibility();
}

addEventListener("pixely:settingschange",event=>{
  if(!event.detail.motion){
    houseReaction?.cancel();signReaction?.cancel();bushReaction?.cancel();
    bushLeaves.querySelectorAll(".bush-leaf").forEach(leaf=>leaf.getAnimations().forEach(animation=>animation.cancel()));
    bushLeaves.replaceChildren();
  }
});
