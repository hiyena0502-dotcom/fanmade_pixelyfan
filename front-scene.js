'use strict';
(function(root){
 const LAYERS=Object.freeze([
  ['sky','back'],['distant-trees','back'],['ground','back'],['fence','back'],['house','back'],
  ['garden-bushes','back'],['side-bushes','back'],['garden-props','back'],['flower-bed','back'],
  ['ground-accents','back'],['foreground-bushes','front']
 ].map(([id,plane],order)=>Object.freeze({id,plane,order,src:'./assets/scenes/front-oct13/'+id+'.webp'})));
 // Original transparent canvases are framed in CSS; no uploaded pixels are resampled.
 const CLOUDS=Object.freeze([
  {id:1,crop:[175,186,304,139]},
  {id:2,crop:[1201,48,357,125]},
  {id:3,crop:[1274,300,246,133]},
  {id:4,crop:[217,42,464,238]},
  {id:5,crop:[1433,44,429,283]},
  {id:6,crop:[581,30,471,242]}
 ].map(cloud=>Object.freeze({...cloud,plane:'behind',crop:Object.freeze(cloud.crop),src:'./assets/scenes/clouds-oct24/'+cloud.id+'.png'})));
 const cloudSeed=Math.floor(Math.random()*4294967296);
 // A session seed gives each crossing fresh traits while preserving its position on redraw.
 function cloudState(cloud,elapsed,seed=cloudSeed){
  function random(cycle,salt){let n=(seed^Math.imul(cloud.id,0x9e3779b1)^Math.imul(cycle+1,0x85ebca6b)^salt)>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;}
  const variant=cycle=>({cycle,width:11+random(cycle,1)*8,top:2+random(cycle,2)*16,opacity:.66+random(cycle,3)*.22,duration:125+random(cycle,4)*80});
  let state=variant(0),start=-((cloud.id-1+random(0,5))/CLOUDS.length)*state.duration*1000;const time=Math.max(0,Number(elapsed)||0);
  while(time>=start+state.duration*1000){start+=state.duration*1000;state=variant(state.cycle+1);}
  return {...state,start};
 }
 function placeCloud(frame,cloud,elapsed){const state=cloudState(cloud,elapsed);Object.assign(frame.style,{width:state.width+'%',top:state.top+'%',opacity:String(state.opacity),animationDuration:state.duration+'s',animationDelay:-(elapsed-state.start)/1000+'s'});}
 const matches=scene=>scene?.id==='front'&&scene.builtin==='house'&&!scene.background;
 const sources=scene=>matches(scene)?[...LAYERS.map(layer=>layer.src),...CLOUDS.map(cloud=>cloud.src)]:[];
 // Only known coordinates for the old built-in illustration migrate. Author-edited rectangles remain editable.
 const legacy={door:[{x:43,y:66,w:10,h:27},{x:42.19730634533194,y:66.32930845225027,w:10,h:27}],bush:[{x:58,y:79,w:17,h:18},{x:56.33286702492017,y:79.65861690450055,w:17,h:18}]};
 const current={door:{x:48,y:60,w:4,h:13},bush:{x:55,y:66,w:7,h:10}};
 function adapt(data){const next=structuredClone(data);for(const scene of next.locations||[])if(matches(scene))for(const object of scene.objects||[]){if(legacy[object.id]?.some(rect=>['x','y','w','h'].every(key=>Math.abs(rect[key]-Number(object.rect?.[key]))<.000001)))object.rect={...current[object.id]};}return next;}
 function image(host,layer){const node=host.ownerDocument.createElement('img');node.className='front-scene-layer';node.dataset.frontSceneLayer=layer.id;node.dataset.plane=layer.plane;node.src=layer.src;node.alt='';node.draggable=false;node.style.zIndex=layer.plane==='front'?'-1':String(layer.order);return node;}
 function cloudPlane(host,plane,elapsed){
  const doc=host.ownerDocument,group=doc.createElement('div');group.className='front-cloud-plane '+plane;group.setAttribute('aria-hidden','true');
  for(const cloud of CLOUDS){
   const [x,y,w,h]=cloud.crop,frame=doc.createElement('div'),art=doc.createElement('img');frame.className='front-cloud';frame.dataset.cloud=String(cloud.id);
   frame.style.aspectRatio=w+'/'+h;placeCloud(frame,cloud,elapsed);
   frame.addEventListener('animationiteration',()=>{frame.style.animationName='none';void frame.offsetWidth;placeCloud(frame,cloud,root.performance?.now?.()||0);frame.style.animationName='';});
   art.src=cloud.src;art.alt='';art.draggable=false;Object.assign(art.style,{width:2048/w*100+'%',height:1152/h*100+'%',left:-x/w*100+'%',top:-y/h*100+'%'});frame.append(art);group.append(frame);
  }
  host.append(group);
 }
 function syncClouds(host,elapsed=root.performance?.now?.()||0){for(const frame of host.querySelectorAll('.front-cloud')){const cloud=CLOUDS.find(c=>String(c.id)===frame.dataset.cloud);if(cloud)placeCloud(frame,cloud,elapsed);}}
 function renderBack(host,scene,elapsed=root.performance?.now?.()||0){host.classList.toggle('has-front-scene',matches(scene));if(!matches(scene))return false;for(const layer of LAYERS)if(layer.plane==='back')host.append(image(host,layer));cloudPlane(host,'behind',elapsed);return true;}
 function renderForeground(host,scene){for(const node of host.querySelectorAll('.front-scene-layer'))node.remove();if(matches(scene))for(const layer of LAYERS)if(layer.plane==='front')host.prepend(image(host,layer));}
 function rustle(host,scene){if(!matches(scene))return false;const node=host.querySelector('[data-front-scene-layer="side-bushes"]');if(!node)return false;node.animate([{transform:'rotate(0deg)'},{transform:'rotate(-.6deg)'},{transform:'rotate(.6deg)'},{transform:'rotate(0deg)'}],{duration:450});return true;}
 const api=Object.freeze({LAYERS,CLOUDS,cloudState,matches,sources,adapt,syncClouds,renderBack,renderForeground,rustle});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PixelyFrontScene=api;
})(typeof window!=='undefined'?window:globalThis);
