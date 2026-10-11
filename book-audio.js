"use strict";
(() => {
  let context,active;
  function preferences(){try{const v=JSON.parse(localStorage.getItem("pixely-settings-v1"))||{};return {motion:v.motion!==false,effects:v.effectsEnabled!==false,volume:Math.max(0,Math.min(100,Number(v.masterVolume??80)))/100*Math.max(0,Math.min(100,Number(v.effectsVolume??75)))/100};}catch{return {motion:true,effects:true,volume:.6};}}
  async function paper(){
    const pref=preferences();if(!pref.effects||!pref.volume)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    try{
      context??=new Audio();if(context.state==="suspended")await context.resume();
      const rate=context.sampleRate,buffer=context.createBuffer(1,Math.ceil(rate*.3),rate),data=buffer.getChannelData(0);let smooth=0,slow=0,seed=41;
      for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=seed/4294967296*2-1;smooth+=.18*(n-smooth);slow+=.035*(n-slow);data[i]=(smooth-slow)*Math.pow(Math.sin(Math.PI*i/data.length),1.5)*.08;}
      if(active){active.stop();active=null;}const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;gain.gain.value=pref.volume;source.connect(gain);gain.connect(context.destination);source.onended=()=>{source.disconnect();gain.disconnect();if(active===source)active=null;};active=source;source.start();
    }catch{}
  }
  window.PixelyBookAudio=Object.freeze({preferences,paper});
})();
