/* Decorative motion: bounded particle counts, no frame timers or game-state changes. */
(()=>{
  'use strict';
  const bounds=[[46,399],[1238,1653],[1323,1610],[95,633],[1508,2008],[518,1066]];
  function cloudPlan(random=Math.random){
    const duration=340+random()*40,offset=random()*300;
    return bounds.map(([left,right],index)=>{
      const center=(left+right)/2/2048*100;
      const phase=(index*50+(random()-.5)*8+offset)%300;
      return {start:130-center,end:-170-center,duration,delay:-phase/300*duration,phase,width:(right-left)/2048*100};
    });
  }
  if(typeof module!=='undefined'&&module.exports) module.exports={cloudPlan};
  if(typeof document==='undefined') return;
  cloudPlan().forEach((plan,index)=>{
    const cloud=document.querySelectorAll('.exterior-cloud')[index];
    if(!cloud) return;
    for(const [name,value] of Object.entries({start:plan.start+'%',end:plan.end+'%',duration:plan.duration+'s',delay:plan.delay+'s'})) cloud.style.setProperty('--cloud-'+name,value);
  });
  document.querySelectorAll('[data-snowfall]').forEach(layer=>{
    const count=layer.dataset.snowfall==='window'?20:layer.dataset.snowfall==='closeup'?36:72;
    const fragment=document.createDocumentFragment();
    for(let n=0;n<count;n++){
      const track=document.createElement('i'),flake=document.createElement('b');
      const near=n%3===0,duration=near?10+Math.random()*6:15+Math.random()*10;
      const values={x:((n+Math.random())/count*100)+'%',size:(near?3+Math.random()*3:1.5+Math.random()*2)+'px',ground:(layer.dataset.snowfall==='window'?108:76+Math.random()*23)+'%',duration:duration+'s',delay:(-Math.random()*duration)+'s',drift:(-18-Math.random()*65)+'px',opacity:near?.85:.55};
      for(const [name,value] of Object.entries(values)) track.style.setProperty('--flake-'+name,value);
      track.appendChild(flake);fragment.appendChild(track);
    }
    layer.appendChild(fragment);
  });
})();
