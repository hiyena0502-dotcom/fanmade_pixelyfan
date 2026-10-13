'use strict';
(function(root){
 const LAYERS=Object.freeze([
  ['sky','back'],['distant-trees','back'],['ground','back'],['fence','back'],['house','back'],
  ['garden-bushes','back'],['side-bushes','back'],['garden-props','back'],['flower-bed','back'],
  ['ground-accents','back'],['foreground-bushes','front']
 ].map(([id,plane],order)=>Object.freeze({id,plane,order,src:'./assets/scenes/front-oct13/'+id+'.webp'})));
 const matches=scene=>scene?.id==='front'&&scene.builtin==='house'&&!scene.background;
 const sources=scene=>matches(scene)?LAYERS.map(layer=>layer.src):[];
 // Only known coordinates for the old built-in illustration migrate. Author-edited rectangles remain editable.
 const legacy={door:[{x:43,y:66,w:10,h:27},{x:42.19730634533194,y:66.32930845225027,w:10,h:27}],bush:[{x:58,y:79,w:17,h:18},{x:56.33286702492017,y:79.65861690450055,w:17,h:18}]};
 const current={door:{x:48,y:60,w:4,h:13},bush:{x:55,y:66,w:7,h:10}};
 function adapt(data){const next=structuredClone(data);for(const scene of next.locations||[])if(matches(scene))for(const object of scene.objects||[]){if(legacy[object.id]?.some(rect=>['x','y','w','h'].every(key=>Math.abs(rect[key]-Number(object.rect?.[key]))<.000001)))object.rect={...current[object.id]};}return next;}
 function image(host,layer){const node=host.ownerDocument.createElement('img');node.className='front-scene-layer';node.dataset.frontSceneLayer=layer.id;node.dataset.plane=layer.plane;node.src=layer.src;node.alt='';node.draggable=false;node.style.zIndex=layer.plane==='front'?'-1':String(layer.order);return node;}
 function renderBack(host,scene){host.classList.toggle('has-front-scene',matches(scene));if(!matches(scene))return false;for(const layer of LAYERS)if(layer.plane==='back')host.append(image(host,layer));return true;}
 function renderForeground(host,scene){for(const node of host.querySelectorAll('.front-scene-layer'))node.remove();if(matches(scene))for(const layer of LAYERS)if(layer.plane==='front')host.prepend(image(host,layer));}
 function rustle(host,scene){if(!matches(scene))return false;const node=host.querySelector('[data-front-scene-layer="side-bushes"]');if(!node)return false;node.animate([{transform:'rotate(0deg)'},{transform:'rotate(-.6deg)'},{transform:'rotate(.6deg)'},{transform:'rotate(0deg)'}],{duration:450});return true;}
 const api=Object.freeze({LAYERS,matches,sources,adapt,renderBack,renderForeground,rustle});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PixelyFrontScene=api;
})(typeof window!=='undefined'?window:globalThis);
