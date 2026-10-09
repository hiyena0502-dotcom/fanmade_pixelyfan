"use strict";
(async()=>{
  const M=window.WardrobeModel,R=window.WardrobeStore,$=id=>document.getElementById(id);
  const categoryLabels={clothes:"옷",items:"소품",face:"얼굴",decor:"장식"};
  let db,state=M.defaults(),images=new Map(),urls=new Map(),sizes=new Map(),slots=new Map();
  let activeCategory="clothes",pendingFile=null,editingId=null,locked=false,saveTimer=0,saveQueue=Promise.resolve(),lastSaved=structuredClone(state);
  const cabinet=$("cabinet"),status=$("save-status");
  function notify(message,error=false){status.textContent=message;status.dataset.error=String(error);}
  function syncUrls(){
    for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();
    for(const [key,blob] of images)if(blob instanceof Blob)urls.set(key,URL.createObjectURL(blob));
  }
  async function updateSizes(entries){
    for(const [key,blob] of entries){
      try{const image=await createImageBitmap(blob);sizes.set(key,{width:image.width,height:image.height});image.close();}catch{sizes.delete(key);}
    }
  }
  function current(){return M.record(state);}
  const hasImage=id=>images.has(M.imageKey(id));
  const visibleLayers=(source=state)=>[{...source.base,id:"base",name:"꿈뜰이 베이스 이미지"},...source.parts].filter(p=>p.visible!==false&&images.has(M.imageKey(p.id))&&sizes.has(M.imageKey(p.id)));
  function drawPreview(){
    const root=$("stage-layers");root.replaceChildren();
    for(const part of visibleLayers()){
      const key=M.imageKey(part.id),placement=M.imagePlacement(sizes.get(key),part),img=document.createElement("img");
      img.className="stage-layer";img.src=urls.get(key);img.alt=part.name;img.draggable=false;
      Object.assign(img.style,{left:placement.x/M.WIDTH*100+"%",top:placement.y/M.HEIGHT*100+"%",width:placement.width/M.WIDTH*100+"%",height:placement.height/M.HEIGHT*100+"%",transform:`translate(-50%,-50%) rotate(${part.rotate}deg)`});
      root.append(img);
    }
    $("empty-stage").hidden=hasImage("base")||visibleLayers().length>0;
    const worn=state.parts.filter(p=>p.visible!==false&&hasImage(p.id));
    $("look-status").textContent=worn.length?worn.map(p=>p.name).join(" · "):hasImage("base")?"베이스만 표시":"베이스 이미지 미등록";
    $("part-count").textContent=worn.length+"개 적용 중";
    $("export-character").disabled=!visibleLayers().length;
  }
  function showPanel(name){
    document.querySelectorAll("[data-panel]").forEach(button=>{const selected=button.dataset.panel===name;button.setAttribute("aria-selected",String(selected));button.tabIndex=selected?0:-1;$("panel-"+button.dataset.panel).hidden=!selected;});
  }
  function refreshCategories(){
    document.querySelectorAll("[data-category]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.category===activeCategory)));
  }
  function renderParts(){
    const list=$("parts-list");list.replaceChildren();refreshCategories();
    const parts=state.parts.filter(p=>p.type===activeCategory);
    if(!parts.length){
      const box=document.createElement("div");box.className="list-empty";
      const strong=document.createElement("strong");
      strong.textContent="등록된 "+categoryLabels[activeCategory]+" 없음";
      box.innerHTML='<svg class="icon" aria-hidden="true"><use href="#icon-hanger"/></svg>';box.append(strong);list.append(box);
    }
    for(const part of parts){
      const card=document.createElement("article");card.className="part-card"+(part.visible!==false?" is-worn":"")+(part.id===state.selected?" is-selected":"");
      const image=document.createElement("img");image.className="part-thumb";image.alt="";if(urls.has(M.imageKey(part.id)))image.src=urls.get(M.imageKey(part.id));
      const caption=document.createElement("div");caption.className="part-caption";
      const name=document.createElement("strong"),subtype=document.createElement("small");name.textContent=part.name;subtype.textContent=part.subtype;
      const label=document.createElement("label"),check=document.createElement("input"),text=document.createElement("span");check.type="checkbox";check.checked=part.visible!==false;check.disabled=!hasImage(part.id);check.setAttribute("aria-label",part.name+" 착용");text.textContent=check.checked?"착용 중":"입기";
      check.addEventListener("change",()=>run(async()=>{const next=M.normalize(state);M.record(next,part.id).visible=check.checked;next.selected=part.id;await commit(next);notify(part.name+(check.checked?" 파츠를 켰어요":" 파츠를 껐어요"));}));
      label.append(check,text);caption.append(name,subtype,label);
      const edit=document.createElement("button");edit.className="part-edit";edit.type="button";edit.textContent="편집";edit.setAttribute("aria-label",part.name+" 파츠 편집");edit.onclick=()=>beginEdit(part.id);
      card.append(image,caption,edit);list.append(card);
    }
  }
  function renderAdjust(){
    if(!M.record(state))state.selected="base";
    const select=$("layer-select");select.replaceChildren();select.add(new Option("베이스 이미지 · 항상 맨 아래","base"));
    for(const [index,part]of state.parts.entries())select.add(new Option(`${index+1} · ${part.name}${part.visible===false?" · 숨김":""}`,part.id));
    select.value=state.selected;syncAdjust();
  }
  function syncAdjust(){
    const part=current(),ready=hasImage(state.selected),index=state.parts.indexOf(part);
    for(const input of document.querySelectorAll("[data-adjust],[data-number]")){
      const key=input.dataset.adjust||input.dataset.number;input.value=part[key];input.disabled=!ready;
      document.querySelector(`[data-value="${key}"]`).textContent=part[key]+(key==="scale"?"%":key==="rotate"?"°":"");
    }
    $("layer-order").textContent=state.selected==="base"?"베이스 · 맨 아래":`레이어 ${index+1} / ${state.parts.length}`;
    document.querySelectorAll("[data-move]").forEach(button=>button.disabled=!ready||state.selected==="base"||(["top","up"].includes(button.dataset.move)?index===state.parts.length-1:index===0));
    for(const id of ["layer-hide","layer-remove","reset-image"])$(id).disabled=!ready;
    $("layer-hide").textContent=part.visible===false?"이미지 표시":"이미지 숨기기";
    $("layer-remove").textContent=state.selected==="base"?"베이스 이미지 제거":"선택 파츠 삭제";
  }
  function renderSlots(){
    const root=$("save-slots");root.replaceChildren();
    for(let index=0;index<M.SLOT_COUNT;index++){
      const saved=slots.get(index),card=document.createElement("article");card.className="save-slot";card.setAttribute("aria-label",`저장 슬롯 ${index+1}`);
      const picture=document.createElement("div");picture.className="slot-picture";
      if(saved?.thumbnail){const img=document.createElement("img");img.src=saved.thumbnail;img.alt=`슬롯 ${index+1} 저장한 모습`;picture.append(img);}else picture.innerHTML='<svg class="icon" aria-hidden="true"><use href="#icon-hanger"/></svg>';
      const body=document.createElement("div");body.className="slot-body";
      const top=document.createElement("div");top.className="slot-top";top.textContent=`SLOT 0${index+1}`;
      if(saved){const clear=document.createElement("button");clear.type="button";clear.className="slot-clear";clear.textContent="×";clear.setAttribute("aria-label",`슬롯 ${index+1} 비우기`);clear.onclick=()=>clearLook(index);top.append(clear);}
      const name=document.createElement("input");name.className="slot-name";name.maxLength=24;name.value=saved?.name||`나들이 모습 ${index+1}`;name.setAttribute("aria-label",`슬롯 ${index+1} 이름`);name.autocomplete="off";
      const meta=document.createElement("span");meta.className="slot-meta";meta.textContent=saved?new Intl.DateTimeFormat("ko-KR",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}).format(saved.updatedAt):"비어 있는 슬롯";
      const actions=document.createElement("div");actions.className="slot-actions";
      const save=document.createElement("button"),load=document.createElement("button");save.type=load.type="button";save.textContent="저장";load.textContent="불러오기";
      save.setAttribute("aria-label",`슬롯 ${index+1}에 저장`);load.setAttribute("aria-label",`슬롯 ${index+1} 불러오기`);save.disabled=!visibleLayers().length;load.disabled=!saved;
      save.onclick=()=>saveLook(index,name.value);load.onclick=()=>loadLook(index);
      actions.append(save,load);body.append(top,name,meta,actions);card.append(picture,body);root.append(card);
    }
  }
  function render(){drawPreview();renderParts();renderAdjust();renderSlots();}
  async function commit(next,updates=[],removed=[]){
    await R.writeWorkspace(db,next,updates,removed);
    state=next;lastSaved=structuredClone(state);
    for(const key of removed){images.delete(key);sizes.delete(key);}
    for(const [key,blob]of updates)images.set(key,blob);
    if(updates.length||removed.length){await updateSizes(updates);syncUrls();}
    render();
  }
  function scheduleSave(){
    clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=0;queueSave();},160);
    notify("변경 사항을 저장하는 중이에요");
  }
  function queueSave(){
    const copy=M.normalize(state);
    saveQueue=saveQueue.then(()=>R.writeWorkspace(db,copy)).then(()=>{lastSaved=structuredClone(copy);notify("변경 사항이 자동 저장됐어요");}).catch(()=>{state=M.normalize(lastSaved);render();notify("저장하지 못했어요 · 브라우저 저장 공간을 확인해 주세요",true);});
    return saveQueue;
  }
  async function flush(){if(saveTimer){clearTimeout(saveTimer);saveTimer=0;queueSave();}await saveQueue;}
  async function run(action){
    if(locked||!db)return;locked=true;cabinet.inert=true;cabinet.setAttribute("aria-busy","true");
    try{await flush();await action();}catch(error){notify(error?.message||"작업을 완료하지 못했어요",true);}finally{locked=false;cabinet.inert=false;cabinet.setAttribute("aria-busy","false");}
  }
  function confirmation(title,description,button="확인"){
    const dialog=$("confirm-dialog");$("confirm-heading").textContent=title;$("confirm-description").textContent=description;$("confirm-yes").textContent=button;dialog.returnValue="";
    return new Promise(resolve=>{dialog.addEventListener("close",()=>resolve(dialog.returnValue==="confirm"),{once:true});dialog.showModal();dialog.querySelector('[value="cancel"]').focus();});
  }
  function resetForm(){editingId=null;pendingFile=null;$("part-form").reset();$("register-heading").textContent="새 파츠 등록";$("upload-label").textContent="파일 선택";$("add-part").textContent="등록하고 켜기";$("add-part").disabled=true;$("cancel-edit").hidden=true;$("file-status").textContent="선택된 파일 없음";refreshSubtypes();}
  function refreshSubtypes(selected){const select=$("new-subtype");select.replaceChildren();M.groups[$("new-type").value].forEach(value=>select.add(new Option(value,value)));if(selected&&M.groups[$("new-type").value].includes(selected))select.value=selected;}
  function beginEdit(id){
    const part=M.record(state,id);if(!part)return;
    resetForm();editingId=id;state.selected=id;$("new-type").value=part.type;refreshSubtypes(part.subtype);$("new-name").value=part.name;$("register-heading").textContent="파츠 수정";$("upload-label").textContent="이미지 교체";$("file-status").textContent="현재 이미지 유지 · 새 파일을 고르면 교체";$("add-part").textContent="수정 저장";$("add-part").disabled=false;$("cancel-edit").hidden=false;
    renderAdjust();showPanel("register");scheduleSave();
  }
  async function validateImage(file){
    if(!file||(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)&&!(/\.(png|jpe?g|webp|gif)$/i.test(file.name||"")&&!file.type)))throw new Error("PNG, JPG, WebP 또는 GIF 이미지를 골라 주세요");
    if(file.size>20*1024*1024)throw new Error("20MB 이하의 이미지를 골라 주세요");
    let bitmap;try{bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>25000000)throw new Error("이미지 크기를 조금 줄여 주세요");}catch(error){throw new Error(error.message==="이미지 크기를 조금 줄여 주세요"?error.message:"이 이미지를 읽을 수 없어요");}finally{bitmap?.close();}
    return file;
  }
  async function characterCanvas(snapshotState=M.normalize(state),snapshotImages=new Map(images)){
    const canvas=document.createElement("canvas");canvas.width=M.WIDTH;canvas.height=M.HEIGHT;const context=canvas.getContext("2d");
    for(const part of [{...snapshotState.base,id:"base"},...snapshotState.parts]){
      const blob=snapshotImages.get(M.imageKey(part.id));if(!blob||part.visible===false)continue;
      const bitmap=await createImageBitmap(blob);
      try{const p=M.imagePlacement(bitmap,part);context.save();context.translate(p.x,p.y);context.rotate(p.rotation);context.drawImage(bitmap,-p.width/2,-p.height/2,p.width,p.height);context.restore();}finally{bitmap.close();}
    }
    return canvas;
  }
  async function saveLook(index,name){
    run(async()=>{
      if(!visibleLayers().length)return;
      if(slots.has(index)&&!await confirmation("이 슬롯의 모습을 바꿀까요?",`슬롯 ${index+1}의 ‘${slots.get(index).name}’ 대신 지금 모습을 저장해요`,"덮어쓰기"))return;
      const copy=M.normalize(state),imageCopy=new Map(images),canvas=await characterCanvas(copy,imageCopy);
      const thumb=document.createElement("canvas");thumb.width=150;thumb.height=180;thumb.getContext("2d").drawImage(canvas,0,0,150,180);
      const snapshot=M.makeSnapshot(copy,imageCopy,name,thumb.toDataURL("image/webp",.82));
      await R.writeSlot(db,index,snapshot);slots.set(index,snapshot);renderSlots();notify(`슬롯 ${index+1}에 ‘${snapshot.name}’ 모습을 저장했어요`);
    });
  }
  function loadLook(index){run(async()=>{
    const snapshot=slots.get(index);if(!snapshot)return;
    const next=M.restoreSnapshot(state,snapshot),updates=snapshot.images.filter(([,blob])=>blob instanceof Blob),savedKeys=new Set(updates.map(([key])=>key));
    const removed=savedKeys.has("base")?[]:["base"];
    await commit(next,updates,removed);resetForm();showPanel("parts");notify(`슬롯 ${index+1}의 ‘${snapshot.name}’ 모습을 불러왔어요`);
  });}
  function clearLook(index){run(async()=>{
    if(!await confirmation("이 슬롯을 비울까요?",`슬롯 ${index+1}에 저장한 모습만 지워요 · 등록된 파츠는 남아 있어요`,"비우기"))return;
    await R.clearSlot(db,index);slots.delete(index);renderSlots();notify(`슬롯 ${index+1}을 비웠어요`);
  });}
  document.querySelectorAll("[data-panel]").forEach((button,index,buttons)=>{
    button.onclick=()=>showPanel(button.dataset.panel);
    button.onkeydown=event=>{if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?buttons.length-1:(index+(event.key==="ArrowRight"?1:-1)+buttons.length)%buttons.length;showPanel(buttons[next].dataset.panel);buttons[next].focus();};
  });
  document.querySelectorAll("[data-category]").forEach(button=>button.onclick=()=>{activeCategory=button.dataset.category;renderParts();});
  $("go-register").onclick=()=>{resetForm();$("new-type").value=activeCategory;refreshSubtypes();showPanel("register");};
  $("new-type").onchange=()=>refreshSubtypes();$("cancel-edit").onclick=()=>{resetForm();showPanel("parts");};
  $("new-file").onchange=()=>{pendingFile=$("new-file").files?.[0]||null;$("file-status").textContent=pendingFile?.name||(editingId?"현재 이미지 유지 · 새 파일을 고르면 교체":"선택된 파일 없음");$("add-part").disabled=!pendingFile&&!editingId;};
  $("part-form").onsubmit=event=>{event.preventDefault();run(async()=>{
    if(!pendingFile&&!editingId)return;const file=pendingFile?await validateImage(pendingFile):null,next=M.normalize(state),type=$("new-type").value,subtype=$("new-subtype").value,name=$("new-name").value.trim()||subtype;
    const id=editingId||"p-"+crypto.randomUUID(),existing=M.record(next,id);
    const part={...M.transform(existing),id,type,subtype,name};
    if(existing)next.parts[next.parts.indexOf(existing)]=part;else next.parts.push(part);
    next.selected=id;if(!existing)part.visible=true;
    await commit(next,file?[[M.imageKey(id),file]]:[]);activeCategory=type;resetForm();renderParts();showPanel("parts");notify(`${name} 파츠를 ${existing?"수정":"등록"}했어요`);
  });};
  $("base-file").onchange=()=>{const file=$("base-file").files?.[0];if(!file)return;run(async()=>{await validateImage(file);const next=M.normalize(state);next.selected="base";next.base.visible=true;await commit(next,[["base",file]]);$("base-file").value="";showPanel("adjust");notify("베이스 이미지를 저장했어요");});};
  $("layer-select").onchange=()=>{state.selected=$("layer-select").value;syncAdjust();renderParts();scheduleSave();};
  document.querySelectorAll("[data-adjust],[data-number]").forEach(input=>input.oninput=()=>{
    const key=input.dataset.adjust||input.dataset.number;if(!input.value||!hasImage(state.selected))return;
    current()[key]=M.clamp(input.value,Number(input.min),Number(input.max),key==="scale"?100:0);syncAdjust();drawPreview();scheduleSave();
  });
  document.querySelectorAll("[data-move]").forEach(button=>button.onclick=()=>run(async()=>{const next=M.normalize(state);if(M.move(next,next.selected,button.dataset.move))await commit(next);notify("레이어 순서를 저장했어요");}));
  $("layer-hide").onclick=()=>run(async()=>{const next=M.normalize(state);M.record(next).visible=!M.record(next).visible;await commit(next);notify("이미지 표시 상태를 저장했어요");});
  $("reset-image").onclick=()=>run(async()=>{const next=M.normalize(state);Object.assign(M.record(next),{x:0,y:0,scale:100,rotate:0});await commit(next);notify("선택한 이미지의 위치를 초기화했어요");});
  $("layer-remove").onclick=()=>run(async()=>{
    const id=state.selected,name=id==="base"?"베이스 이미지":current().name;
    if(!await confirmation("이 이미지를 제거할까요?",`‘${name}’을 옷장에서 제거해요 · 이미 저장한 슬롯의 모습은 유지돼요`,"제거"))return;
    const next=M.normalize(state);next.parts=next.parts.filter(p=>p.id!==id);if(id==="base")next.base=M.transform();next.selected="base";
    await commit(next,[],[M.imageKey(id)]);resetForm();notify(`${name}을 제거했어요`);
  });
  $("export-character").onclick=()=>run(async()=>{
    if(!visibleLayers().length)return;const canvas=await characterCanvas(),blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/png"));
    if(!blob)throw new Error("캐릭터 이미지를 저장하지 못했어요");
    const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="꿈뜰이-캐릭터.png";document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);notify("배경 없는 캐릭터 PNG를 저장했어요");
  });
  window.addEventListener("pagehide",()=>{if(saveTimer){clearTimeout(saveTimer);saveTimer=0;queueSave();}try{localStorage.setItem("pixely-dressup-editor-v1",JSON.stringify(state));}catch{}for(const url of urls.values())URL.revokeObjectURL(url);});
  cabinet.inert=true;
  try{
    db=await R.open();const workspace=await R.readWorkspace(db);state=M.normalize(workspace.state);images=workspace.images;slots=await R.readSlots(db);await updateSizes(images);syncUrls();lastSaved=structuredClone(state);render();refreshSubtypes();cabinet.inert=false;cabinet.setAttribute("aria-busy","false");notify("파츠와 배치는 자동 저장돼요 · 마음에 드는 모습은 아래 슬롯에 담아 주세요");
  }catch(error){cabinet.inert=false;cabinet.setAttribute("aria-busy","false");render();refreshSubtypes();notify(error.message||"옷장 저장을 열지 못했어요 · 페이지를 다시 열어 주세요",true);}
})();
