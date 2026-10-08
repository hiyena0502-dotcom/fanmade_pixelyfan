"use strict";

(() => {
  const DEFAULTS=Object.freeze({masterVolume:80,effectsVolume:75,textVolume:45,effectsSound:"none",textSound:"none",textSpeed:35,textSize:22,autoDelay:2500,motion:true,interactionHints:false,skipReadOnly:true,autoSave:true});
  const numeric={masterVolume:[0,100],effectsVolume:[0,100],textVolume:[0,100],autoDelay:[500,5000]};
  const choices={textSpeed:[15,35,65,0],textSize:[18,22,26],effectsSound:["none","paper","wood","pop"],textSound:["none","soft","pixel","bubble"]};
  function normalize(value){
    const source=value&&typeof value==="object"&&!Array.isArray(value)?value:{};
    // Fold older independent switches into one preference without re-enabling disabled effects.
    const migrated={...source,motion:typeof source.motion==="boolean"?source.motion:!["animations","leaves","smoke"].some(key=>source[key]===false)};
    return Object.fromEntries(Object.entries(DEFAULTS).map(([key,fallback])=>{
      let next=migrated[key];
      if(typeof fallback==="boolean") next=typeof next==="boolean"?next:fallback;
      else if(choices[key]) next=choices[key].includes(next)?next:fallback;
      else {
        const step=key==="autoDelay"?500:1;
        next=typeof next==="number"&&Number.isFinite(next)?Math.round(Math.max(numeric[key][0],Math.min(numeric[key][1],next))/step)*step:fallback;
      }
      return [key,next];
    }));
  }
  function volume(settings,bus){return settings.masterVolume/100*(settings[`${bus}Volume`]??100)/100;}
  function canSkip(settings,alreadyRead){return !settings.skipReadOnly||alreadyRead===true;}
  if(typeof module!=="undefined"&&module.exports){module.exports={DEFAULTS,normalize,volume,canSkip};return;}

  const KEY="pixely-settings-v1";
  const dialog=document.querySelector("#settings-dialog");
  const controls=[...dialog.querySelectorAll("[data-setting]")];
  const tabs=[...dialog.querySelectorAll('[role="tab"]')];
  const panels=[...dialog.querySelectorAll('[role="tabpanel"]')];
  const status=dialog.querySelector(".settings-status");
  const preview=dialog.querySelector(".dialogue-preview-text");
  const media=new Set();
  let settings,storageAvailable=true,audioContext,activeSound,previewFrame=0;
  try{settings=normalize(JSON.parse(localStorage.getItem(KEY)));}catch{settings=normalize();}

  function persist(){
    try{localStorage.setItem(KEY,JSON.stringify(settings));storageAvailable=true;}
    catch{storageAvailable=false;}
    status.textContent=storageAvailable?"변경하면 바로 저장돼요":"이번 접속 동안 적용돼요";
  }
  function syncControls(){
    controls.forEach(control=>{
      const key=control.dataset.setting,value=settings[key];
      if(control.type==="checkbox") control.checked=value;
      else control.value=String(value);
      if(control.type==="range"){
        const label=key==="autoDelay"?`${(value/1000).toFixed(1)}초`:`${value}%`;
        dialog.querySelector(`[data-output="${key}"]`).textContent=label;
        control.setAttribute("aria-valuetext",label);
        control.style.setProperty("--range-fill",`${(value-Number(control.min))/(Number(control.max)-Number(control.min))*100}%`);
      }
    });
    dialog.querySelectorAll("[data-sound-check]").forEach(button=>{button.disabled=settings[`${button.dataset.soundCheck}Sound`]==="none";});
  }
  function apply(){
    document.body.classList.toggle("motions-off",!settings.motion);
    document.body.classList.toggle("interaction-hints",settings.interactionHints);
    document.documentElement.style.setProperty("--dialogue-font-size",`${settings.textSize}px`);
    document.documentElement.style.setProperty("--dialogue-character-ms",`${settings.textSpeed?1000/settings.textSpeed:0}ms`);
    document.documentElement.style.setProperty("--dialogue-auto-delay",`${settings.autoDelay}ms`);
    preview.style.fontSize=`${settings.textSize}px`;
    document.querySelectorAll("audio[data-audio-bus],video[data-audio-bus]").forEach(element=>media.add(element));
    media.forEach(element=>{element.volume=volume(settings,element.dataset.audioBus||"effects");});
    if(activeSound) activeSound.gain.gain.setValueAtTime(volume(settings,activeSound.bus),audioContext.currentTime);
    dispatchEvent(new CustomEvent("pixely:settingschange",{detail:{...settings}}));
  }
  function update(key,value){settings=normalize({...settings,[key]:value});syncControls();apply();persist();}

  window.PixelySettings=Object.freeze({
    get:()=>({...settings}),
    getVolume:bus=>volume(settings,bus),
    playEffect:target=>playSound("effects",{target}),
    canSkip:alreadyRead=>canSkip(settings,alreadyRead),
    registerAudio:(element,bus="effects")=>{element.dataset.audioBus=bus;media.add(element);element.volume=volume(settings,bus);return ()=>media.delete(element);},
    saveProgress:progress=>{
      if(!settings.autoSave) return false;
      try{localStorage.setItem("pixely-autosave-v1",JSON.stringify({savedAt:Date.now(),progress}));return true;}catch{return false;}
    }
  });
  document.addEventListener("play",event=>{
    const element=event.target;
    if(element instanceof HTMLMediaElement&&element.dataset.audioBus){media.add(element);element.volume=volume(settings,element.dataset.audioBus);}
  },true);

  function showPreview(){
    cancelAnimationFrame(previewFrame);
    const text="초대는 받았고, 귀가는 미정!";
    if(!settings.textSpeed){preview.textContent=text;return;}
    preview.textContent="";
    const start=performance.now();
    function tick(now){
      const count=Math.min(text.length,Math.floor((now-start)/1000*settings.textSpeed));
      preview.textContent=text.slice(0,count);
      if(count<text.length&&dialog.open&&!document.querySelector("#settings-dialogue").hidden) previewFrame=requestAnimationFrame(tick);
    }
    previewFrame=requestAnimationFrame(tick);
  }
  function selectTab(tab,focus=false){
    tabs.forEach(item=>{const selected=item===tab;item.setAttribute("aria-selected",String(selected));item.tabIndex=selected?0:-1;});
    panels.forEach(panel=>{panel.hidden=panel.id!==tab.getAttribute("aria-controls");});
    cancelAnimationFrame(previewFrame);
    if(tab.getAttribute("aria-controls")==="settings-dialogue") showPreview();
    if(focus) tab.focus({preventScroll:true});
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener("click",()=>selectTab(tab));
    tab.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
      selectTab(tabs[next],true);
    });
  });
  controls.forEach(control=>control.addEventListener(control.type==="range"?"input":"change",()=>{
    update(control.dataset.setting,control.type==="checkbox"?control.checked:typeof DEFAULTS[control.dataset.setting]==="number"?Number(control.value):control.value);
    if(["textSpeed","textSize"].includes(control.dataset.setting)) showPreview();
  }));

  document.querySelector('[data-action="settings"]').addEventListener("click",()=>{
    if(dialog.open) return;
    syncControls();dialog.showModal();
    dialog.querySelector(".settings-close").focus({preventScroll:true});
    if(!document.querySelector("#settings-dialogue").hidden) showPreview();
  });
  dialog.querySelectorAll("[data-close-settings]").forEach(button=>button.addEventListener("click",()=>dialog.close()));
  dialog.addEventListener("click",event=>{
    if(event.target!==dialog) return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) dialog.close();
  });
  dialog.addEventListener("close",()=>{cancelAnimationFrame(previewFrame);document.querySelector('[data-action="settings"]').focus({preventScroll:true});});
  dialog.querySelector("[data-reset-settings]").addEventListener("click",()=>{
    settings=normalize();syncControls();apply();persist();
    status.textContent="기본 설정으로 되돌렸어요";
    if(!document.querySelector("#settings-dialogue").hidden) showPreview();
  });
  dialog.querySelector("[data-replay-preview]").addEventListener("click",showPreview);

  async function playSound(bus,{target="",previewSound=false}={}){
    const kind=settings[`${bus}Sound`];
    if(kind==="none") return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){if(previewSound) status.textContent="이 브라우저에서는 소리 미리듣기를 사용할 수 없어요";return false;}
    try{
      audioContext??=new Audio();
      if(audioContext.state==="suspended") await audioContext.resume();
      const level=volume(settings,bus);
      if(!level){if(previewSound) status.textContent="현재 음량이 0으로 설정돼 있어요";return false;}
      const samples=window.PixelySounds.render(kind,target);
      const buffer=audioContext.createBuffer(1,samples.length,window.PixelySounds.sampleRate);
      buffer.copyToChannel(samples,0);
      // A short fade replaces the previous click/preview without a hard audio cut.
      if(activeSound){
        const previous=activeSound,time=audioContext.currentTime;
        previous.gain.gain.cancelScheduledValues(time);
        previous.gain.gain.setValueAtTime(previous.gain.gain.value,time);
        previous.gain.gain.linearRampToValueAtTime(0,time+.018);
        previous.source.stop(time+.02);
      }
      const source=audioContext.createBufferSource(),gain=audioContext.createGain();
      source.buffer=buffer;gain.gain.value=level;
      source.connect(gain);gain.connect(audioContext.destination);
      activeSound={source,gain,bus};
      source.onended=()=>{source.disconnect();gain.disconnect();if(activeSound?.source===source) activeSound=null;};
      source.start();
      if(previewSound) status.textContent="선택한 소리를 들려드려요";
      return true;
    }catch{if(previewSound) status.textContent="소리를 재생하지 못했어요";return false;}
  }
  dialog.querySelectorAll("[data-sound-check]").forEach(button=>button.addEventListener("click",()=>playSound(button.dataset.soundCheck,{previewSound:true})));
  syncControls();apply();
})();
