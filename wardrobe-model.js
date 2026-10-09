"use strict";
(() => {
  const SLOT_COUNT=5, WIDTH=1000, HEIGHT=1200;
  const groups={
    clothes:["상의","하의","겉옷","신발","기타 의상"],
    items:["손에 드는 소품","착용 소품","머리 소품","기타 소품"],
    face:["눈","입","눈썹","볼·표정","기타 얼굴"],
    decor:["이펙트","스티커","주변 장식","기타 장식"]
  };
  const clamp=(value,min,max,fallback=0)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
  const transform=source=>({x:clamp(source?.x,-500,500),y:clamp(source?.y,-600,600),scale:clamp(source?.scale,20,300,100),rotate:clamp(source?.rotate,-180,180),visible:source?.visible!==false});
  const defaults=()=>({version:2,parts:[],base:transform(),selected:"base",nextId:1});
  function normalize(source){
    const result=defaults(),seen=new Set();
    result.base=transform(source?.base);
    for(const part of Array.isArray(source?.parts)?source.parts:[]){
      if(!part||typeof part.id!=="string"||part.id==="base"||seen.has(part.id)||!groups[part.type])continue;
      seen.add(part.id);
      result.parts.push({...transform(part),id:part.id,type:part.type,subtype:String(part.subtype||groups[part.type][0]).slice(0,40),name:String(part.name||part.subtype||"내 파츠").slice(0,40)});
    }
    result.selected=source?.selected==="base"||seen.has(source?.selected)?source.selected:"base";
    result.nextId=Math.max(1,Math.floor(clamp(source?.nextId,1,1000000,1)));
    return result;
  }
  const imageKey=id=>id==="base"?"base":"part-"+id;
  const record=(state,id=state.selected)=>id==="base"?state.base:state.parts.find(part=>part.id===id);
  function move(state,id,direction){
    const index=state.parts.findIndex(part=>part.id===id);
    if(index<0)return false;
    const next=direction==="bottom"?0:direction==="top"?state.parts.length-1:direction==="up"?index+1:index-1;
    if(next<0||next>=state.parts.length||next===index)return false;
    const [part]=state.parts.splice(index,1);state.parts.splice(next,0,part);return true;
  }
  function imagePlacement(size,part){
    const t=transform(part),fit=.8*Math.min(WIDTH/size.width,HEIGHT/size.height);
    return {x:WIDTH/2+t.x,y:HEIGHT/2+t.y,width:size.width*fit*t.scale/100,height:size.height*fit*t.scale/100,rotation:t.rotate*Math.PI/180};
  }
  function previewFrame(placements,viewport){
    let left=0,top=0,right=WIDTH,bottom=HEIGHT;
    for(const p of placements){
      const c=Math.abs(Math.cos(p.rotation)),s=Math.abs(Math.sin(p.rotation));
      const halfWidth=(p.width*c+p.height*s)/2,halfHeight=(p.width*s+p.height*c)/2;
      left=Math.min(left,p.x-halfWidth);right=Math.max(right,p.x+halfWidth);
      top=Math.min(top,p.y-halfHeight);bottom=Math.max(bottom,p.y+halfHeight);
    }
    // Keep the whole composition inside the flat, safe area below the mirror arch.
    const scale=Math.min(viewport.width*.8/(right-left),viewport.height*.76/(bottom-top));
    return {scale,x:viewport.width/2-(left+right)/2*scale,y:viewport.height*.2+(viewport.height*.76-(bottom-top)*scale)/2-top*scale};
  }
  function makeSnapshot(state,images,name,thumbnail,now=Date.now()){
    const copy=normalize(state),entries=[];
    for(const id of ["base",...copy.parts.map(part=>part.id)]){
      const key=imageKey(id),blob=images.get(key);
      if(blob instanceof Blob)entries.push([key,blob.slice(0,blob.size,blob.type)]);
    }
    return {version:1,state:copy,images:entries,name:String(name||"꿈뜰이의 모습").trim().slice(0,24),thumbnail,updatedAt:now};
  }
  // Restore the saved appearance without discarding parts registered afterwards.
  function restoreSnapshot(current,snapshot){
    if(!snapshot||!Array.isArray(snapshot.images)||!snapshot.state)throw new Error("올바른 저장 데이터가 아니에요");
    const saved=normalize(snapshot.state),ids=new Set(saved.parts.map(part=>part.id));
    saved.parts.push(...normalize(current).parts.filter(part=>!ids.has(part.id)).map(part=>({...part,visible:false})));
    saved.nextId=Math.max(saved.nextId,current.nextId||1);
    return saved;
  }
  const api=Object.freeze({SLOT_COUNT,WIDTH,HEIGHT,groups,clamp,transform,defaults,normalize,imageKey,record,move,imagePlacement,previewFrame,makeSnapshot,restoreSnapshot});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else window.WardrobeModel=api;
})();
