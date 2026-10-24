'use strict';
(function(root){
 const sampleRate=24000,duration=24;
 // Original procedural field ambience: filtered wind, soft grass rustle and distant bird phrases.
 // No external recordings; periodic wind envelopes and a seam fade keep the loop quiet.
 function render(){
  const samples=new Float32Array(sampleRate*duration);let seed=13413,low=0,grass=0;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  const phrases=[{at:1.4,f:1840},{at:5.6,f:2170},{at:11.2,f:1640},{at:17.9,f:1980},{at:21.4,f:2320}];
  for(let i=0;i<samples.length;i++){
   const t=i/sampleRate,n=noise();low+=.012*(n-low);grass+=.24*(n-grass);
   const gust=.6+.25*Math.sin(t*.53)+.15*Math.sin(t*1.31);
   const rustle=Math.pow(Math.max(0,Math.sin(t*.87+.7)),4);
   let v=low*.45*gust+(grass-low)*.018*rustle;
   for(const bird of phrases){for(let j=0;j<3;j++){
    const age=t-bird.at-j*.19;if(age<0||age>.12)continue;
    const envelope=Math.pow(Math.sin(Math.PI*age/.12),2),phase=2*Math.PI*(bird.f*age+1600*age*age);
    v+=.025*envelope*(Math.sin(phase)+.16*Math.sin(2*phase));
   }}
   const seam=Math.min(1,t/.9,(duration-t)/.9);samples[i]=v*Math.max(0,seam);
  }
  samples[0]=samples[samples.length-1]=0;return samples;
 }
 function create(){
  let context,source,gain,active=false,unavailable=false;
  const volume=()=>root.PixelySettings?.getVolume('effects')??0;
  function sync(){if(!gain)return;const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(active&&!document.hidden?volume():0,now,.22);}
  async function prime(){
   if(unavailable)return;
   try{
    const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio){unavailable=true;return;}
    if(!context){context=new Audio();gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);const buffer=context.createBuffer(1,sampleRate*duration,sampleRate);buffer.copyToChannel(render(),0);source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.connect(gain);source.start();}
    if(context.state==='suspended')await context.resume();sync();
   }catch{unavailable=true;}
  }
  function setActive(value){if(active===value)return;active=value;sync();}
  root.addEventListener('pixely:settingschange',sync);document.addEventListener('visibilitychange',sync);
  root.addEventListener('pagehide',()=>{source?.stop();void context?.close();},{once:true});
  return {prime,setActive};
 }
 const api={sampleRate,duration,render,create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PixelyOutdoorAmbience=api;
})(typeof window!=='undefined'?window:globalThis);
