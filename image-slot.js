'use strict';
(()=>{
const types={background:{name:'전체 배경',ratio:'16:9'},chapter:{name:'챕터 사진',ratio:'4:3'},postcard:{name:'엽서',ratio:'3:2'},card:{name:'콜렉션 카드',ratio:'2:3'},item:{name:'아이템',ratio:'1:1'},character:{name:'캐릭터',ratio:'native'},decoration:{name:'장식',ratio:'native'}};
const ratios=['frame','native','21:9','16:9','16:10','4:3','3:2','2:3','1:1'];
const number=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
function typeFor(key){return key.startsWith('scene:')?'background':key.startsWith('character:')?'character':key.startsWith('item:')?'item':key.endsWith(':decoration')?'decoration':'decoration';}
function normalize(value,type='decoration'){const v=value||{};return {type:Object.hasOwn(types,v.type)?v.type:Object.hasOwn(types,type)?type:'decoration',ratio:ratios.includes(v.ratio)?v.ratio:'frame',fit:v.fit==='cover'?'cover':'contain',flip:v.flip===true};}
function source(value){return {width:Math.round(number(value?.width,0,100000,0)),height:Math.round(number(value?.height,0,100000,0))};}
function ratioValue(ratio,natural){if(ratio==='native')return natural?.width&&natural?.height?natural.width/natural.height:0;const [w,h]=String(ratio).split(':').map(Number);return w>0&&h>0?w/h:0;}
function frame(width,height,ratio,natural){const r=ratioValue(ratio,natural);if(!r)return {width,height};const w=Math.min(width,height*r);return {width:w,height:w/r};}
function transform(t,flip=false){return `translate(${t?.x||0}%,${t?.y||0}%) scale(${(t?.scale||100)/100}) rotate(${t?.rotate||0}deg) scaleX(${flip?-1:1})`;}
const live=new Map();let observer;
function apply(img,record={},type='decoration',options={}){
 const slot=normalize(record.slot,type);img.draggable=false;img.dataset.imageType=slot.type;img.dataset.imageFit=slot.fit;
 img.style.objectFit=slot.fit;img.style.transform=transform(options.transform===false?null:record.transform,slot.flip);
 if(typeof ResizeObserver==='undefined')return;
 const layout=()=>{const parent=img.parentElement;if(!parent)return;const box=frame(parent.clientWidth,parent.clientHeight,slot.ratio,{width:img.naturalWidth,height:img.naturalHeight});Object.assign(img.style,{position:'absolute',width:box.width+'px',height:box.height+'px',left:(parent.clientWidth-box.width)/2+'px',top:(parent.clientHeight-box.height)/2+'px',maxWidth:'none',maxHeight:'none'});};
 img.onload=layout;queueMicrotask(()=>{if(!img.isConnected)return;observer||=new ResizeObserver(()=>{for(const [node,entry]of live){if(node.isConnected)entry.layout();else{if(!entry.parent.isConnected)observer.unobserve(entry.parent);live.delete(node);}}});live.set(img,{layout,parent:img.parentElement});observer.observe(img.parentElement);layout();});
}
const api={types,ratios,normalize,source,typeFor,ratioValue,frame,transform,apply};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.PixelyImageSlot=api;
})();
