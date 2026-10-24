'use strict';
(function(root){
 const LAYERS=Object.freeze([
  ['sky','back'],['distant-trees','back'],['ground','back'],['fence','back'],['house','back'],
  ['garden-bushes','back'],['side-bushes','back'],['garden-props','back'],['flower-bed','back'],
  ['ground-accents','back'],['foreground-bushes','front']
 ].map(([id,plane],order)=>Object.freeze({id,plane,order,src:'./assets/scenes/front-oct13/'+id+'.webp'})));
 // Original transparent canvases are framed in CSS; no uploaded pixels are resampled.
 const CLOUDS=Object.freeze([
  {id:1,plane:'behind',crop:[175,186,304,139],width:16,top:8,opacity:.8,duration:150,phase:.12},
  {id:2,plane:'behind',crop:[1201,48,357,125],width:20,top:17,opacity:.72,duration:180,phase:.48},
  {id:3,plane:'behind',crop:[1274,300,246,133],width:13,top:26,opacity:.76,duration:165,phase:.82},
  {id:4,plane:'ahead',crop:[217,42,464,238],width:20,top:27,opacity:.76,duration:110,phase:.45},
  {id:5,plane:'ahead',crop:[1433,44,429,283],width:17,top:31,opacity:.6,duration:125,phase:.08},
  {id:6,plane:'ahead',crop:[581,30,471,242],width:21,top:15,opacity:.7,duration:120,phase:.75}
 ].map(cloud=>Object.freeze({...cloud,crop:Object.freeze(cloud.crop),src:'./assets/scenes/clouds-oct24/'+cloud.id+'.png'})));
 const matches=scene=>scene?.id==='front'&&scene.builtin==='house'&&!scene.background;
 const sources=scene=>matches(scene)?[...LAYERS.map(layer=>layer.src),...CLOUDS.map(cloud=>cloud.src)]:[];
 // Only known coordinates for the old built-in illustration migrate. Author-edited rectangles remain editable.
 const legacy={door:[{x:43,y:66,w:10,h:27},{x:42.19730634533194,y:66.32930845225027,w:10,h:27}],bush:[{x:58,y:79,w:17,h:18},{x:56.33286702492017,y:79.65861690450055,w:17,h:18}]};
 const current={door:{x:48,y:60,w:4,h:13},bush:{x:55,y:66,w:7,h:10}};
 function adapt(data){const next=structuredClone(data);for(const scene of next.locations||[])if(matches(scene))for(const object of scene.objects||[]){if(legacy[object.id]?.some(rect=>['x','y','w','h'].every(key=>Math.abs(rect[key]-Number(object.rect?.[key]))<.000001)))object.rect={...current[object.id]};}return next;}
 function image(host,layer){const node=host.ownerDocument.createElement('img');node.className='front-scene-layer';node.dataset.frontSceneLayer=layer.id;node.dataset.plane=layer.plane;node.src=layer.src;node.alt='';node.draggable=false;node.style.zIndex=layer.plane==='front'?'-1':String(layer.order);return node;}
 function cloudPlane(host,plane,elapsed){
  const doc=host.ownerDocument,group=doc.createElement('div');group.className='front-cloud-plane '+plane;group.setAttribute('aria-hidden','true');
  for(const cloud of CLOUDS.filter(cloud=>cloud.plane===plane)){
   const [x,y,w,h]=cloud.crop,frame=doc.createElement('div'),art=doc.createElement('img');frame.className='front-cloud';frame.dataset.cloud=String(cloud.id);
   Object.assign(frame.style,{width:cloud.width+'%',top:cloud.top+'%',aspectRatio:w+'/'+h,opacity:String(cloud.opacity),animationDuration:cloud.duration+'s',animationDelay:-(elapsed/1000+cloud.duration*cloud.phase)+'s'});
   art.src=cloud.src;art.alt='';art.draggable=false;Object.assign(art.style,{width:2048/w*100+'%',height:1152/h*100+'%',left:-x/w*100+'%',top:-y/h*100+'%'});frame.append(art);group.append(frame);
  }
  host.append(group);
 }
 function syncClouds(host,elapsed=root.performance?.now?.()||0){for(const frame of host.querySelectorAll('.front-cloud')){const cloud=CLOUDS.find(c=>String(c.id)===frame.dataset.cloud);if(cloud)frame.style.animationDelay=-(elapsed/1000+cloud.duration*cloud.phase)+'s';}}
 function renderBack(host,scene,elapsed=root.performance?.now?.()||0){host.classList.toggle('has-front-scene',matches(scene));if(!matches(scene))return false;for(const layer of LAYERS)if(layer.plane==='back')host.append(image(host,layer));cloudPlane(host,'behind',elapsed);cloudPlane(host,'ahead',elapsed);return true;}
 function renderForeground(host,scene){for(const node of host.querySelectorAll('.front-scene-layer'))node.remove();if(matches(scene))for(const layer of LAYERS)if(layer.plane==='front')host.prepend(image(host,layer));}
 function rustle(host,scene){if(!matches(scene))return false;const node=host.querySelector('[data-front-scene-layer="side-bushes"]');if(!node)return false;node.animate([{transform:'rotate(0deg)'},{transform:'rotate(-.6deg)'},{transform:'rotate(.6deg)'},{transform:'rotate(0deg)'}],{duration:450});return true;}
 const api=Object.freeze({LAYERS,CLOUDS,matches,sources,adapt,syncClouds,renderBack,renderForeground,rustle});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PixelyFrontScene=api;
})(typeof window!=='undefined'?window:globalThis);
