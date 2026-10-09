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
  const transform=source=>({x:clamp(source?.x,-500,500),y:clamp(source?.y,-600,600),scale:clamp(source?.scale,20,600,100),rotate:clamp(source?.rotate,-180,180),visible:source?.visible!==false});
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
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const p of placements){
      if(!p)continue;
      const c=Math.abs(Math.cos(p.rotation)),s=Math.abs(Math.sin(p.rotation));
      const halfWidth=(p.width*c+p.height*s)/2,halfHeight=(p.width*s+p.height*c)/2;
      left=Math.min(left,p.x-halfWidth);right=Math.max(right,p.x+halfWidth);
      top=Math.min(top,p.y-halfHeight);bottom=Math.max(bottom,p.y+halfHeight);
    }
    // Scale controls stay visible until the painted artwork actually fills the mirror.
    // Transparent PNG margins neither force a zoom-out nor push the artwork down.
    const safe={left:viewport.width*.08,right:viewport.width*.92,top:viewport.height*.14,bottom:viewport.height*.96};
    const baseScale=Math.min(viewport.width*.84/WIDTH,viewport.height*.82/HEIGHT);
    if(!Number.isFinite(left))return {scale:baseScale,x:viewport.width/2-WIDTH/2*baseScale,y:viewport.height*.55-HEIGHT/2*baseScale};
    const scale=Math.min(baseScale,(safe.right-safe.left)/(right-left),(safe.bottom-safe.top)/(bottom-top));
    return {scale,x:clamp(viewport.width/2-WIDTH/2*scale,safe.left-left*scale,safe.right-right*scale),y:clamp(viewport.height*.55-HEIGHT/2*scale,safe.top-top*scale,safe.bottom-bottom*scale)};
  }
  function alphaBounds(pixels,width,height){
    let left=width,top=height,right=-1,bottom=-1;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]){
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    return right<0?null:{left,top,width:right-left+1,height:bottom-top+1};
  }
  function previewPlacement(size,part){
    const p=imagePlacement(size,part),bounds=size.painted;
    if(bounds===null)return null;
    if(!bounds)return p;
    const dx=(bounds.left+bounds.width/2-size.width/2)*p.width/size.width;
    const dy=(bounds.top+bounds.height/2-size.height/2)*p.height/size.height;
    return {...p,x:p.x+dx*Math.cos(p.rotation)-dy*Math.sin(p.rotation),y:p.y+dx*Math.sin(p.rotation)+dy*Math.cos(p.rotation),width:bounds.width*p.width/size.width,height:bounds.height*p.height/size.height};
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
  const api=Object.freeze({SLOT_COUNT,WIDTH,HEIGHT,groups,clamp,transform,defaults,normalize,imageKey,record,move,imagePlacement,previewFrame,alphaBounds,previewPlacement,makeSnapshot,restoreSnapshot});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else window.WardrobeModel=api;
})();
