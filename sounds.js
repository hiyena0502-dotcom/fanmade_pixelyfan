"use strict";

// Original, procedural sounds: soft toy-like UI notes and tiny voiced syllables.
(() => {
  const RATE=24000;
  const effects={
    paper:[{time:0,pitch:780,end:540,duration:.16,level:.34,bell:.08}],
    wood:[{time:0,pitch:470,end:300,duration:.19,level:.36,bell:.03}],
    pop:[{time:0,pitch:660,end:720,duration:.18,level:.26,bell:.22},{time:.095,pitch:990,end:1020,duration:.25,level:.22,bell:.24}]
  };
  const voices={soft:{pitch:365,duration:.063,gap:.013,level:.3},pixel:{pitch:380,duration:.054,gap:.012,level:.28},bubble:{pitch:345,duration:.074,gap:.017,level:.3}};
  const vowels=[[730,1090,2440],[270,2290,3010],[300,870,2240],[530,1840,2480],[570,840,2410]];
  const phrase=[0,2,1,4,3,1,2,0,4];
  const melody=[1,1.015,.992,1.012,1.003,.988,1.008,1,.995];
  function envelope(t,duration,attack=.006){
    if(t<=0||t>=duration) return 0;
    return Math.min(1,t/attack)*Math.pow(Math.sin(Math.PI*t/duration),.65);
  }
  function render(kind,target="",syllableIndex=null){
    const notes=effects[kind],voice=voices[kind];
    if(!notes&&!voice) return new Float32Array(0);
    const single=Number.isInteger(syllableIndex)&&syllableIndex>=0;
    const baseDuration=notes?Math.max(...notes.map(note=>note.time+note.duration))+.03:(single?1:phrase.length)*(voice.duration+voice.gap)+.11;
    const duration=notes&&target==="bush"?Math.max(baseDuration,.58):notes&&target==="house"?Math.max(baseDuration,.29):baseDuration;
    const samples=new Float32Array(Math.ceil(duration*RATE));
    if(notes){
      for(const note of notes){
        let phase=0;
        const offset=Math.round(note.time*RATE);
        for(let i=0;i<Math.ceil(note.duration*RATE);i++){
          const t=i/RATE,u=t/note.duration;
          const pitch=note.end+(note.pitch-note.end)*Math.exp(-u*8);
          phase+=2*Math.PI*pitch/RATE;
          const tone=Math.sin(phase)+note.bell*Math.sin(phase*2.76)*Math.exp(-u*5)+.055*Math.sin(phase*2);
          samples[offset+i]+=tone*envelope(t,note.duration)*Math.exp(-u*2.4)*note.level;
        }
      }
      if(target==="house"){
        // A quiet low spring underneath the chosen UI timbre.
        let phase=0;
        for(let i=0;i<Math.ceil(.26*RATE);i++){
          const t=i/RATE;
          phase+=2*Math.PI*(110+85*Math.exp(-t*21))/RATE;
          samples[i]+=Math.sin(phase)*envelope(t,.26,.009)*Math.exp(-t*11)*.11;
        }
      }else if(target==="bush"){
        // Filtered noise in three soft strokes, like leaves brushing together.
        let seed=173,low=0;
        for(let i=0;i<samples.length;i++){
          seed=(Math.imul(seed,1664525)+1013904223)>>>0;
          const noise=seed/4294967296*2-1,t=i/RATE;
          low+=.17*(noise-low);
          const stroke=[.025,.17,.32].reduce((sum,start)=>sum+envelope(t-start,.19,.027),0);
          samples[i]+=(noise-low)*stroke*.045;
        }
      }
    }else{
      let offset=0;
      for(let step=0;step<(single?1:phrase.length);step++){
        const syllable=single?syllableIndex%phrase.length:step;
        const length=voice.duration*(syllable%3===1?.88:1.08),formants=vowels[phrase[syllable]];
        let phase=0;
        const base=voice.pitch*melody[syllable];
        const weights=Array.from({length:Math.min(28,Math.floor(RATE*.45/(base*1.055)))},(_,h)=>{
          const frequency=(h+1)*base;
          // A smooth harmonic source with vowel resonances, rather than a beep.
          return (.6/(h+1)+formants.reduce((sum,f,index)=>sum+[1,.42,.12][index]*Math.exp(-.5*Math.pow((frequency-f*1.1)/(index===0?175:250),2)),0))/Math.pow(h+1,.5);
        });
        const scale=voice.level/weights.reduce((sum,w)=>sum+w,0);
        for(let i=0;i<Math.ceil(length*RATE);i++){
          const t=i/RATE,u=t/length;
          const pitch=base*(1+.009*Math.sin(u*Math.PI)-.012*u);
          phase+=2*Math.PI*pitch/RATE;
          let sample=0;
          for(let h=0;h<weights.length;h++) sample+=weights[h]*Math.sin(phase*(h+1));
          samples[offset+i]+=sample*scale*envelope(t,length,.008);
        }
        offset+=Math.ceil((length+voice.gap+(syllable===3?.048:0))*RATE);
      }
    }
    return samples;
  }
  function effectKind(target){return ({house:"wood",bush:"paper",menu:"pop"})[target]??"none";}
  const api=Object.freeze({sampleRate:RATE,render,effectKind});
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  else window.PixelySounds=api;
})();
