"use strict";
(() => {
  const D=typeof module!=="undefined"&&module.exports?require("./book-data.js"):window.PixelyBookData;
  const clamp=(n,min,max,fallback=min)=>Number.isFinite(Number(n))?Math.min(max,Math.max(min,Number(n))):fallback;
  const text=(v,length=600)=>typeof v==="string"?v.slice(0,length):"";
  const validId=v=>typeof v==="string"&&/^[a-z0-9][a-z0-9_-]{0,79}$/i.test(v)&&!["__proto__","constructor","prototype"].includes(v);
  function record(value,index,seen){
    if(!value||!validId(value.id)||seen.has(value.id))return null;seen.add(value.id);
    return {id:value.id,number:Math.floor(clamp(value.number,0,9999,index+1)),title:text(value.title,80),intro:text(value.intro,120),description:text(value.description),chapter:text(value.chapter,100),location:text(value.location,100),related:text(value.related,160),decoration:["flower","clover","letter","crystal","magnifier","drop","none"].includes(value.decoration)?value.decoration:"flower"};
  }
  function catalogue(source){
    if(!source||!Array.isArray(source.chapters)||!source.collections)return D.catalogue();
    const seen=new Set(),clean=list=>(Array.isArray(list)?list:[]).slice(0,500).map((v,i)=>record(v,i,seen)).filter(Boolean);
    return {version:1,chapters:clean(source.chapters),collections:Object.fromEntries(Object.keys(D.categories).map(key=>[key,clean(source.collections[key])]))};
  }
  function progress(source){
    const result=D.progress();
    if(source&&typeof source==="object"){
      result.chapters=Object.fromEntries(Object.entries(source.chapters||{}).filter(([id])=>validId(id)).map(([id,state])=>[id,{unlocked:state?.unlocked===true||state?.cleared===true,cleared:state?.cleared===true}]));
      result.collections=Object.fromEntries(Object.entries(source.collections||{}).filter(([id])=>validId(id)).map(([id,found])=>[id,found===true]));
    }
    return result;
  }
  function updateProgress(current,patch){return progress({chapters:{...current.chapters,...patch?.chapters},collections:{...current.collections,...patch?.collections}});}
  const chapterState=(entry,p)=>p.chapters[entry.id]?.cleared?"cleared":p.chapters[entry.id]?.unlocked?"available":"locked";
  function display(entry,kind,p){
    const status=kind==="chapters"?chapterState(entry,p):p.collections[entry.id]===true?"registered":"locked";
    if(status==="locked")return {id:entry.id,number:entry.number,status,title:kind==="chapters"?"아직 펼치지 않은 이야기":"???",intro:"",description:"",chapter:"",location:"",related:"",decoration:"none"};
    return {...entry,status,title:entry.title||"제목 없는 기록"};
  }
  function paginate(entries,page,size){const total=Math.max(1,Math.ceil(entries.length/size)),current=Math.floor(clamp(page,0,total-1,0));return {page:current,total,entries:entries.slice(current*size,(current+1)*size)};}
  function view(source,cat){
    const chapter=paginate(cat.chapters,source?.chapterPage,4),category=Object.hasOwn(D.categories,source?.category)?source.category:"people";
    return {chapterPage:chapter.page,chapterSelected:cat.chapters.some(e=>e.id===source?.chapterSelected)?source.chapterSelected:cat.chapters[0]?.id||"",category,pages:Object.fromEntries(Object.keys(D.categories).map(k=>[k,paginate(cat.collections[k],source?.pages?.[k],6).page])),selections:Object.fromEntries(Object.keys(D.categories).map(k=>[k,cat.collections[k].some(e=>e.id===source?.selections?.[k])?source.selections[k]:cat.collections[k][0]?.id||""]))};
  }
  function imageTransform(source){return {x:clamp(source?.x,-50,50,0),y:clamp(source?.y,-50,50,0),scale:clamp(source?.scale,20,400,100),rotate:clamp(source?.rotate,-180,180,0)};}
  const imageKey=(id,role="main")=>id+":"+(role==="decoration"?"decoration":"main");
  const api=Object.freeze({clamp,validId,catalogue,progress,updateProgress,chapterState,display,paginate,view,imageTransform,imageKey});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else window.PixelyBookModel=api;
})();
