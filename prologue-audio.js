/* Small synthesized ambience and effects. No external audio or background music. */
(()=>{'use strict';
let context=null,master=null,ambient=null,birdTimer=0,mode='home',enabled=true;
try{enabled=localStorage.getItem('pixely-prologue-sound')!=='off'}catch{}
function init(){
  if(!enabled)return;
  if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;context=new Audio();master=context.createGain();master.gain.value=.22;master.connect(context.destination)}
  if(context.state==='suspended')context.resume().catch(()=>{});
}
function tone(hz,length,volume=.15,type='sine',end=hz){
  if(!context||!enabled)return;
  const t=context.currentTime,o=context.createOscillator(),gain=context.createGain();
  o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+length);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(volume,t+.02);gain.gain.exponentialRampToValueAtTime(.0001,t+length);
  o.connect(gain);gain.connect(master);o.start();o.stop(t+length+.02);
}
function silence(){clearInterval(birdTimer);birdTimer=0;if(ambient){try{ambient.stop()}catch{}ambient.disconnect();ambient=null}}
function scene(name){
  mode=name;silence();if(name==='home'||name==='end'||!enabled)return;
  init();if(!context)return;
  const b=context.createBuffer(1,context.sampleRate*3,context.sampleRate),d=b.getChannelData(0);let last=0;
  for(let i=0;i<d.length;i++){last=(last+(Math.random()*2-1)*.025)/1.025;d[i]=last}
  ambient=context.createBufferSource();ambient.buffer=b;ambient.loop=true;
  const filter=context.createBiquadFilter(),gain=context.createGain();filter.type='lowpass';filter.frequency.value=['exterior','door-closeup'].includes(name)?650:200;
  gain.gain.value=name==='basement'?.09:.18;ambient.connect(filter);filter.connect(gain);gain.connect(master);ambient.start();
  if(['exterior','door-closeup','attic'].includes(name))birdTimer=setInterval(()=>{tone(1800,.19,.09,'sine',2900);setTimeout(()=>tone(2600,.12,.06,'sine',2100),230)},6500);
}
function effect(name){init();if(name==='knock'){tone(130,.1,.4,'triangle',80);setTimeout(()=>tone(130,.1,.4,'triangle',80),160)}
  else if(name==='step'){tone(115,.12,.16,'triangle',65)}
  else if(name==='box-fall'){tone(85,.5,.45,'triangle',35)}
  else if(['hum','shake-light'].includes(name)){tone(78,2,.14);tone(81,2,.12)}
  else if(['warp','fold','pull'].includes(name)){tone(110,1.8,.24,'sine',460);tone(165,1.8,.12,'sine',700)}
  else if(name==='glass'){tone(820,.7,.08);tone(1230,.6,.04)}
}
function toggle(){enabled=!enabled;try{localStorage.setItem('pixely-prologue-sound',enabled?'on':'off')}catch{}scene(mode);return enabled}
document.addEventListener('visibilitychange',()=>{if(context){if(document.hidden)context.suspend().catch(()=>{});else if(enabled&&mode!=='home'&&mode!=='end')context.resume().catch(()=>{})}});
window.PixelyAudio={init,scene,effect,silence,toggle,get enabled(){return enabled}};
})();
