"use strict";
(async()=>{
  const B=window.PixelyBooks,M=window.PixelyBookModel,$=id=>document.getElementById(id);
  if(!B.editorMode)return;await B.ready;
  const dialog=$("book-editor"),urls=new Map();let draft=null,draftImages=new Map(),removed=new Set(),group="chapters",saving=false,uploadEpoch=0;
  const role=()=>$("editor-image-role").value,key=()=>M.imageKey(draft.id,role());
  function notify(text,error=false){$("editor-status").textContent=text;$("editor-status").dataset.error=String(error);}
  function revoke(){for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();}
  function activeEntries(){const cat=B.getCatalogue();return group==="chapters"?cat.chapters:cat.collections[group];}
  function options(selected){const select=$("editor-record");select.replaceChildren();for(const entry of activeEntries())select.add(new Option(`${String(entry.number).padStart(2,"0")} · ${entry.title||"미공개 기록 자리"}`,entry.id));if(selected&&!activeEntries().some(e=>e.id===selected.id))select.add(new Option("새 기록 · 저장 전",selected.id));if(selected)select.value=selected.id;}
  function begin(entry){
    uploadEpoch++;revoke();draft=structuredClone(entry);draftImages=new Map();removed=new Set();
    for(const part of ["main","decoration"]){const k=M.imageKey(entry.id,part),image=B.getImage(k);if(image?.blob instanceof Blob)draftImages.set(k,{blob:image.blob,transform:M.imageTransform(image.transform)});}
    options(entry);for(const [field,id]of [["number","number"],["title","name"],["intro","intro"],["description","description"],["chapter","chapter"],["location","location"],["related","related"],["decoration","decoration"]])$("editor-"+id).value=draft[field]??"";
    const state=$("editor-state");state.replaceChildren();const progress=B.getProgress();
    if(group==="chapters"){for(const [value,label]of [["locked","잠금"],["available","진행 가능"],["cleared","클리어"]])state.add(new Option(label,value));state.value=M.chapterState(draft,progress);}
    else{state.add(new Option("미등록","locked"));state.add(new Option("등록 완료","registered"));state.value=progress.collections[draft.id]?"registered":"locked";}
    $("editor-image-role").value="main";$("editor-upload").value="";notify("");draw();
  }
  function draw(){
    if(!draft)return;const root=$("editor-image-preview"),image=draftImages.get(key());root.replaceChildren();
    if(image){if(!urls.has(key()))urls.set(key(),URL.createObjectURL(image.blob));const img=B.el("img");img.src=urls.get(key());img.alt="편집할 이미지";const t=M.imageTransform(image.transform);img.style.transform=`translate(${t.x}%,${t.y}%) scale(${t.scale/100}) rotate(${t.rotate}deg)`;root.append(img);}
    else{const placeholder=B.el("span","image-placeholder");placeholder.append(B.icon("image"),B.el("span","","이미지를 골라 주세요"));root.append(placeholder);}
    for(const input of dialog.querySelectorAll("[data-image-range],[data-image-number]")){const prop=input.dataset.imageRange||input.dataset.imageNumber;input.value=M.imageTransform(image?.transform)[prop];input.disabled=!image;}
    $("editor-image-delete").disabled=$("editor-image-reset").disabled=!image;
  }
  $("edit-launch").onclick=()=>{
    group=B.kind==="chapters"?"chapters":B.getView().category;const selected=B.kind==="chapters"?B.getView().chapterSelected:B.getView().selections[group];const list=activeEntries(),entry=list.find(e=>e.id===selected)||list[0];
    if(entry)begin(entry);else createDraft();dialog.showModal();$("editor-record").focus();
  };
  function close(){if(saving)return;uploadEpoch++;dialog.close();revoke();draft=null;$("edit-launch").focus();}
  $("editor-close").onclick=$("editor-cancel").onclick=close;
  dialog.addEventListener("cancel",event=>{event.preventDefault();close();});
  $("editor-record").onchange=()=>{const entry=activeEntries().find(e=>e.id===$("editor-record").value);if(entry)begin(entry);};
  function createDraft(){const list=activeEntries();begin({id:"record-"+crypto.randomUUID(),number:Math.max(0,...list.map(e=>e.number))+1,title:"",intro:"",description:"",chapter:"",location:"",related:"",decoration:group==="chapters"?"flower":"none"});}
  $("add-record").onclick=createDraft;
  $("editor-image-role").onchange=()=>{uploadEpoch++;$("editor-upload").value="";draw();};
  $("editor-upload").onchange=async()=>{
    const file=$("editor-upload").files?.[0];if(!file||!draft)return;const epoch=++uploadEpoch,currentKey=key();let bitmap;
    try{
      if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type))throw new Error("PNG, JPG, WebP 또는 GIF를 골라 주세요");
      if(file.size>20*1024*1024)throw new Error("20MB 이하의 이미지를 골라 주세요");
      bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>25000000)throw new Error("이미지 크기를 조금 줄여 주세요");
      if(epoch!==uploadEpoch||!dialog.open)return;
      if(urls.has(currentKey)){URL.revokeObjectURL(urls.get(currentKey));urls.delete(currentKey);}
      draftImages.set(currentKey,{blob:file,transform:M.imageTransform()});removed.delete(currentKey);notify("이미지를 골랐어요 · 기록 저장을 누르면 반영돼요");draw();
    }catch(error){notify(error.message||"이미지를 읽지 못했어요",true);}finally{bitmap?.close();$("editor-upload").value="";}
  };
  $("editor-image-delete").onclick=()=>{if(!draft)return;const k=key();draftImages.delete(k);removed.add(k);if(urls.has(k)){URL.revokeObjectURL(urls.get(k));urls.delete(k);}notify("이미지를 뺐어요 · 저장 전에는 취소할 수 있어요");draw();};
  $("editor-image-reset").onclick=()=>{const image=draftImages.get(key());if(image){image.transform=M.imageTransform();draw();}};
  for(const input of dialog.querySelectorAll("[data-image-range],[data-image-number]"))input.oninput=()=>{
    const image=draftImages.get(key());if(!image||!input.value)return;const prop=input.dataset.imageRange||input.dataset.imageNumber;image.transform=M.imageTransform({...image.transform,[prop]:input.value});draw();
  };
  $("editor-save").onclick=async()=>{
    if(!draft||saving)return;saving=true;dialog.querySelectorAll("button,input,select,textarea").forEach(e=>e.disabled=true);
    try{
      for(const [field,id]of [["number","number"],["title","name"],["intro","intro"],["description","description"],["chapter","chapter"],["location","location"],["related","related"],["decoration","decoration"]])draft[field]=$("editor-"+id).value;
      const persistent=await B.saveRecord(group,draft,$("editor-state").value,[...draftImages], [...removed]);
      begin(activeEntries().find(e=>e.id===draft.id));notify(persistent?"이 브라우저에 기록을 저장했어요":"이번 접속 동안만 적용했어요 · 페이지를 닫으면 사라져요");
    }catch(error){notify(error.message||"저장하지 못했어요",true);}finally{saving=false;dialog.querySelectorAll("button,input,select,textarea").forEach(e=>e.disabled=false);draw();}
  };
  addEventListener("pagehide",revoke);
})();
