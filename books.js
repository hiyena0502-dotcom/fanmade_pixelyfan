"use strict";
(() => {
  const D=window.PixelyBookData,M=window.PixelyBookModel,R=window.PixelyBookStore,A=window.PixelyBookAudio;
  const $=id=>document.getElementById(id),kind=document.body.dataset.book,isChapter=kind==="chapters";
  let db=null,catalogue=D.catalogue(),progress=D.progress(),view=M.view(null,catalogue),images=new Map(),urls=new Map(),adapter=null,busy=false,queue=Promise.resolve();
  const admin=window.PixelyAdmin;let editing=false,preview=false,draftContent=null,legacy=null,baseRevision="initial",dirty=false;
  const editorMode=()=>editing&&!preview;
  function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
  function icon(name){const svg=document.createElementNS("http://www.w3.org/2000/svg","svg"),use=document.createElementNS(svg.namespaceURI,"use");svg.classList.add("icon");svg.setAttribute("aria-hidden","true");use.setAttribute("href","#book-"+name);svg.append(use);return svg;}
  function banner(message){$("save-banner").textContent=message;$("save-banner").hidden=!message;}
  function preferences(){document.body.classList.toggle("motions-off",!A.preferences().motion);}
  preferences();addEventListener("storage",preferences);addEventListener("pixely:settingschange",preferences);
  function serial(action){const next=queue.then(action);queue=next.catch(()=>{});return next;}
  function syncUrls(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();for(const [key,record]of images)if(record.blob instanceof Blob)urls.set(key,URL.createObjectURL(record.blob));else if(record.path)urls.set(key,admin.imageURL(record.path));}
  function paintImage(container,id,locked=false,role="main"){
    container.replaceChildren();container.classList.toggle("is-locked",locked);
    const key=M.imageKey(id,role),record=images.get(key);
    if(!locked&&record&&urls.has(key)){
      const img=el("img");img.src=urls.get(key);img.alt="";img.draggable=false;
      const t=M.imageTransform(record.transform);img.style.transform=`translate(${t.x}%,${t.y}%) scale(${t.scale/100}) rotate(${t.rotate}deg)`;container.append(img);
    }else{const placeholder=el("span","image-placeholder");placeholder.append(icon(locked?"lock":"image"));if(!locked&&role==="main"&&editorMode())placeholder.append(el("span","","이미지 등록 전"));container.append(placeholder);}
  }
  function sticker(id,decoration){
    if(decoration==="none"&&!images.has(M.imageKey(id,"decoration")))return null;
    const node=el("span","sticker sticker-"+decoration);node.setAttribute("aria-hidden","true");
    if(images.has(M.imageKey(id,"decoration")))paintImage(node,id,false,"decoration");else node.append(icon(decoration));return node;
  }
  const entries=()=>isChapter?catalogue.chapters:catalogue.collections[view.category];
  const selected=()=>isChapter?view.chapterSelected:view.selections[view.category];
  function pageData(){return M.paginate(entries(),isChapter?view.chapterPage:view.pages[view.category],isChapter?4:6);}
  function saveView(){const snapshot=structuredClone(view);return serial(async()=>{if(db)await R.writeView(db,snapshot);}).catch(()=>banner("페이지 위치를 저장하지 못했어요"));}
  function stamp(){const node=el("span","clear-stamp");node.setAttribute("aria-label","클리어");node.append(icon("flower"));return node;}
  function collectionStamp(ids){
    if(isChapter||!A.preferences().motion)return;
    for(const card of document.querySelectorAll(".collection-card"))if(ids.includes(card.dataset.recordId)){
      const node=stamp();node.classList.add("stamp-in");node.setAttribute("aria-label","새 기록 등록");card.append(node);setTimeout(()=>node.remove(),1400);
    }
  }
  function renderGrid(){
    const root=$("record-grid"),page=pageData();root.replaceChildren();
    for(const entry of page.entries){
      const data=M.display(entry,isChapter?"chapters":view.category,progress),locked=data.status==="locked";
      const card=el("button",(isChapter?"chapter-card":"collection-card")+(locked?" is-locked":""));card.type="button";card.dataset.recordId=entry.id;card.setAttribute("aria-pressed",String(selected()===entry.id));card.setAttribute("aria-label",isChapter?`${entry.number===0?"프롤로그":"챕터 "+entry.number} · ${data.title} · ${locked?"잠김":data.status==="cleared"?"클리어":"진행 가능"}`:`${String(entry.number).padStart(3,"0")} · ${data.title} · ${locked?"미등록":"등록 완료"}`);
      const number=el("span","card-number",isChapter?entry.number===0?"프롤로그":`챕터 ${String(entry.number).padStart(2,"0")}`:`NO.${String(entry.number).padStart(3,"0")}`),image=el("div","image-area");paintImage(image,entry.id,locked);
      const title=el("strong","",data.title);if(isChapter){card.append(image,title,number);number.append(el("span","card-status",locked?"잠김":data.status==="cleared"?"클리어":"진행 가능"));if(data.status==="cleared")card.append(stamp());if(!locked){const decor=sticker(entry.id,data.decoration);if(decor)card.append(decor);}}
      else card.append(number,image,title);
      card.ondblclick=()=>{if(editorMode())$("edit-launch").click();};card.onclick=()=>{if(isChapter)view.chapterSelected=entry.id;else view.selections[view.category]=entry.id;renderGrid();renderDetail();void saveView();};root.append(card);
    }
    const max=isChapter?4:6;
    for(let i=page.entries.length;i<max;i++){const blank=el("div","empty-card");blank.setAttribute("aria-hidden","true");blank.append(icon(isChapter?"letter":"image"),el("span","",isChapter?"새 이야기를 기다리는 자리":"새 기록을 기다리는 자리"));root.append(blank);}
    $("page-prev").disabled=busy||page.page===0;$("page-next").disabled=busy||page.page===page.total-1;
    $("page-count").value=`${String(page.page+1).padStart(2,"0")} / ${String(page.total).padStart(2,"0")}`;
    $("left-page-number").textContent=String(page.page*2+1).padStart(2,"0");$("right-page-number").textContent=String(page.page*2+2).padStart(2,"0");
    $("list-summary").textContent=isChapter?`${entries().filter(e=>M.chapterState(e,progress)==="cleared").length}개의 이야기를 마쳤어`:`${entries().filter(e=>progress.collections[e.id]).length} / ${entries().length} 등록`;
    if(!isChapter){$("list-subtitle").textContent=D.categories[view.category].label+" · 모험에서 발견한 기록";document.querySelectorAll("[data-category]").forEach(tab=>{const active=tab.dataset.category===view.category;tab.setAttribute("aria-selected",String(active));tab.tabIndex=active?0:-1;});}
  }
  function renderDetail(){
    const root=$("record-detail"),entry=entries().find(e=>e.id===selected());root.replaceChildren();
    if(!entry){const header=el("div","detail-heading");header.append(el("h2","","아직 비어 있는 페이지"));const photo=el("div","detail-photo"),area=el("div","image-area");paintImage(area,"");photo.append(area);root.append(header,photo,el("p","detail-description",isChapter?"앞으로 펼쳐질 이야기를 담을 자리야":"모험 중 발견한 기록이 이곳에 모일 거야"));return;}
    const data=M.display(entry,isChapter?"chapters":view.category,progress),locked=data.status==="locked";
    const header=el("div","detail-header"),number=el("span","detail-number",isChapter?entry.number===0?"프롤로그":`챕터 ${String(entry.number).padStart(2,"0")}`:locked?"NO. ???":`NO.${String(entry.number).padStart(3,"0")}`),status=el("span","status-label"+(locked?" is-locked":""),locked?isChapter?"잠김":"미등록":isChapter?data.status==="cleared"?"클리어":"진행 가능":"등록 완료");header.append(number,status);
    const title=el("div","detail-heading");title.append(el("h2","",data.title));if(data.intro)title.append(el("p","",data.intro));
    const photo=el("div","detail-photo"),area=el("div","image-area");paintImage(area,entry.id,locked);photo.append(area);
    if(!locked&&(isChapter||images.has(M.imageKey(entry.id,"decoration")))){const decor=sticker(entry.id,data.decoration);if(decor)photo.append(decor);}
    const description=el("p","detail-description",locked?isChapter?"아직 열리지 않은 이야기야\n모험을 이어 가면 이 페이지도 펼쳐질 거야":"아직 발견하지 못한 기록이야\n모험을 진행하면 새로운 정보가 열릴지도?":data.description||"아직 작성되지 않은 기록이야");
    root.append(header,title,photo,description);
    if(!locked&&!isChapter){const meta=el("dl","detail-meta");const fields=view.category==="people"?[["등장 콘텐츠",data.location],["관련 챕터",data.chapter]]:view.category==="cards"?[["획득 챕터",data.chapter],["획득 장소",data.location]]:view.category==="items"?[["획득 위치",data.location],["관련 챕터",data.chapter]]:[["관련 인물",data.related],["발견한 챕터",data.chapter]];for(const [label,value]of fields){meta.append(el("dt","",label),el("dd","",value||"기록 전"));}root.append(meta);}
    if(isChapter){const button=el("button","chapter-start","이 챕터 선택");button.type="button";button.id="chapter-start";button.disabled=locked||typeof adapter?.startChapter!=="function";button.onclick=()=>requestChapter(entry.id);root.append(button);if(editorMode()&&!locked&&!adapter?.startChapter)root.append(el("p","connection-note","게임 진행 연결 전"));}
  }
  function render(){view=M.view(view,catalogue);renderGrid();renderDetail();}
  async function turn(delta){
    if(busy)return;const page=pageData(),next=page.page+delta;if(next<0||next>=page.total)return;
    busy=true;renderGrid();const pageNode=document.querySelector(".left-page"),motion=A.preferences().motion&&!matchMedia("(prefers-reduced-motion:reduce)").matches;
    let sheet;if(motion){sheet=el("div","turn-sheet"+(delta<0?" reverse":""));sheet.setAttribute("aria-hidden","true");pageNode.append(sheet);}void A.paper();
    if(motion)await new Promise(resolve=>setTimeout(resolve,240));
    if(isChapter){view.chapterPage=next;view.chapterSelected=M.paginate(entries(),next,4).entries[0]?.id||"";}else{view.pages[view.category]=next;view.selections[view.category]=M.paginate(entries(),next,6).entries[0]?.id||"";}
    render();if(motion)await new Promise(resolve=>setTimeout(resolve,240));sheet?.remove();busy=false;renderGrid();void saveView();
  }
  $("page-prev").onclick=()=>turn(-1);$("page-next").onclick=()=>turn(1);
  document.querySelectorAll("[data-category]").forEach((tab,index,tabs)=>{
    tab.onclick=()=>{if(busy)return;view.category=tab.dataset.category;render();void saveView();};
    tab.onkeydown=event=>{if(!["ArrowUp","ArrowDown","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowDown"?1:-1)+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();};
  });
  async function applyProgress(patch){return serial(async()=>{const next=M.updateProgress(progress,patch),newly=Object.keys(next.collections).filter(id=>next.collections[id]&&!progress.collections[id]);if(db)await R.writeProgress(db,next);progress=next;render();collectionStamp(newly);dispatchEvent(new CustomEvent("pixely:books-progress",{detail:structuredClone(progress)}));});}
  async function connectGame(value){if(!value||typeof value.startChapter!=="function")throw new Error("startChapter 연결 함수가 필요해요");if(typeof value.getProgress==="function")await applyProgress(await value.getProgress());adapter=value;renderDetail();}
  async function requestChapter(id){const entry=catalogue.chapters.find(e=>e.id===id);if(!entry||M.chapterState(entry,progress)==="locked"||!adapter?.startChapter)return false;const button=$("chapter-start");if(button)button.disabled=true;try{await adapter.startChapter(id);return true;}catch{banner("챕터를 열지 못했어요");return false;}finally{renderDetail();}}
  async function saveRecord(group,record,state,updates,removed){return serial(async()=>{
    if(!editorMode())throw new Error("개발자 편집 화면에서만 기록을 수정할 수 있어요");
    const next=structuredClone(catalogue),list=group==="chapters"?next.chapters:next.collections[group];if(!list)throw new Error("알 수 없는 분류예요");
    const index=list.findIndex(e=>e.id===record.id);if(index<0)list.push(record);else list[index]=record;
    const normalized=M.catalogue(next);if(!(group==="chapters"?normalized.chapters:normalized.collections[group]).some(e=>e.id===record.id))throw new Error("기록 번호를 확인해 주세요");
    const wasRegistered=progress.collections[record.id]===true,nextProgress=M.updateProgress(progress,group==="chapters"?{chapters:{[record.id]:{unlocked:state!=="locked",cleared:state==="cleared"}}}:{collections:{[record.id]:state==="registered"}});

    catalogue=normalized;progress=nextProgress;for(const key of removed)images.delete(key);for(const [key,image]of updates)images.set(key,image);syncUrls();
    if(isChapter){view.chapterSelected=record.id;view.chapterPage=Math.floor(normalized.chapters.findIndex(e=>e.id===record.id)/4);}else{view.selections[group]=record.id;view.pages[group]=Math.floor(normalized.collections[group].findIndex(e=>e.id===record.id)/6);}
    dirty=true;render();if(state==="registered"&&!wasRegistered)collectionStamp([record.id]);void saveView();await cacheDraft();controls();return !!db;
  });}
  async function playerProgress(){progress=M.progress(legacy?.progress);try{const active=await PixelyGameStore.active(),slots=await PixelyGameStore.slots(),saved=active&&(active.type==="auto"?slots.auto:slots.manual).get(active.slot);if(saved)progress=M.progress({chapters:saved.state.chapters,collections:saved.state.collections});}catch{}}
  async function cacheDraft(){if(db)await R.writeDraft(db,{content:{...draftContent,catalogue},images:[...images],progress,baseRevision,dirty});}
  function contentImages(value){images=new Map(Object.entries(value?.assets||{}));syncUrls();catalogue=M.catalogue(value?.catalogue);}
  async function switchMode(){editing=admin.isEditor();preview=false;if(editing){const local=db&&await R.readDraft(db);draftContent=await admin.request("draft");baseRevision=draftContent.revision;if(local?.dirty&&local.baseRevision===baseRevision){draftContent=local.content;catalogue=M.catalogue(local.content.catalogue);images=new Map(local.images);progress=M.progress(local.progress);dirty=true;syncUrls();}else{contentImages(draftContent);progress=M.progress();dirty=false;}}else{contentImages(admin.getPublished());await playerProgress();}render();controls();}
  let bar;
  function controls(){
    $("edit-launch").hidden=!editorMode();
    if(bar){bar.hidden=!editing;bar.querySelector('[data-draft-status]').textContent=dirty?"편집 적용됨 · 임시 저장 전":baseRevision==="initial"?"아직 임시 저장 전":"임시 저장됨";bar.querySelector('[data-preview]').textContent=preview?"편집으로":"미리보기";}
  }
  function authorControls(){bar=el("div","author-bar");bar.hidden=true;bar.innerHTML='<span data-draft-status></span><button type="button" data-save>임시 저장</button><button type="button" data-preview>미리보기</button><button type="button" data-publish>사이트에 반영</button><button type="button" data-import>브라우저 기록 가져오기</button><button type="button" data-off>모드 끄기</button>';document.body.append(bar);
    const run=async fn=>{bar.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){banner(e.message);}finally{bar.querySelectorAll('button').forEach(b=>b.disabled=false);controls();}};
    bar.querySelector('[data-save]').onclick=()=>run(async()=>{const raw=await admin.prepare({...draftContent,catalogue},images);draftContent=await admin.save(raw,baseRevision);baseRevision=draftContent.revision;dirty=false;contentImages(draftContent);await cacheDraft();render();banner("임시 저장했어요 · 일반 화면에는 아직 반영되지 않았어요");});
    bar.querySelector('[data-preview]').onclick=()=>{preview=!preview;document.body.classList.toggle('is-author-preview',preview);render();controls();};
    bar.querySelector('[data-publish]').onclick=()=>run(async()=>{if(dirty)throw Error("먼저 임시 저장을 해 주세요");await admin.publish(baseRevision);banner("사이트에 반영했어요 · 일반 화면에서도 같은 콘텐츠가 보여요");});
    bar.querySelector('[data-import]').onclick=()=>run(async()=>{if(!legacy?.catalogue)throw Error("가져올 예전 브라우저 기록이 없어요");catalogue=M.catalogue(legacy.catalogue);images=new Map(legacy.images);syncUrls();dirty=true;await cacheDraft();render();banner("예전 기록을 가져왔어요 · 확인한 뒤 임시 저장을 눌러 주세요");});
    bar.querySelector('[data-off]').onclick=()=>admin.setMode(false);
    const toggle=el('button','developer-link','개발자 모드');toggle.style.cssText='position:fixed;right:20px;top:12px;z-index:8';toggle.hidden=!admin.getSession().authenticated;toggle.onclick=()=>admin.setMode(!editing);document.body.append(toggle);
  }
  const ready=(async()=>{
    try{db=await R.open();legacy=await R.read(db);view=M.view(legacy.view,catalogue);}catch{db=null;banner("브라우저 저장 공간을 사용할 수 없어요");}
    await admin.ready;authorControls();await switchMode();
    adapter={startChapter:async id=>{if(editorMode()||preview){banner("미리보기에서는 게임을 시작하지 않아요");return;}location.href='./game.html?mode=chapter&chapter='+encodeURIComponent(id);}};renderDetail();
    addEventListener('pixely:developer-mode',()=>switchMode().catch(e=>banner(e.message)));
    if(new URLSearchParams(location.search).get('edit')==='1'&&!editing)void admin.loginOpen();
  })();
  window.PixelyBooks=Object.freeze({ready,kind,get editorMode(){return editorMode();},categories:D.categories,el,icon,paintImage,getCatalogue:()=>structuredClone(catalogue),getProgress:()=>structuredClone(progress),getView:()=>structuredClone(view),getImage:key=>images.get(key),saveRecord,applyProgress,connectGame,requestChapter,turn,isPersistent:()=>!!db});
  addEventListener("pagehide",()=>{for(const url of urls.values())URL.revokeObjectURL(url);db?.close();});
})();
