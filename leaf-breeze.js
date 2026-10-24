'use strict';
window.PixelyLeafBreeze={create(breeze,{enabled=()=>true}={}){
  const greens=["#4f8b58","#669b50","#7fa95d","#a4bb70","#397e63","#6aa878"];
  const shapes=["M5 25C2 13 15 5 29 4C27 18 20 30 5 25Z","M5 25C4 10 20 3 29 4C30 18 16 32 5 25Z","M5 25C1 16 12 6 29 4C24 19 16 29 5 25Z"];
  const random=(min,max)=>min+Math.random()*(max-min);
  let width=breeze.clientWidth,height=breeze.clientHeight;
  let active=true,frame=0,lastTime=0,windTime=0,nextEmission=random(3,6);
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
    const flutter=Math.sin(leaf.age*leaf.flutter+leaf.phase);
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
    const flip=Math.cos(leaf.age*leaf.flipSpeed+leaf.phase);
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
    const step=dt;
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
    if(active&&!document.hidden&&enabled()) frame=requestAnimationFrame(animate);
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
return {setActive(value){if(active===value)return;active=value;syncVisibility();},refresh:syncVisibility};
}};
