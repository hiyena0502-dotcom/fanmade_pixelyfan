"use strict";

// Original, procedural sounds: soft object textures and tiny voiced syllables.
(() => {
  const RATE=24000;
  const voices={
    soft:{pitch:330,duration:.063,gap:.013,level:.28,fundamental:1,brightness:.25,attack:.012,formants:[620,1120,2200]},
    pixel:{pitch:365,duration:.054,gap:.012,level:.25,fundamental:.8,brightness:.4,attack:.008,formants:[700,1450,2400]},
    bubble:{pitch:285,duration:.074,gap:.017,level:.29,fundamental:1.2,brightness:.18,attack:.016,formants:[520,930,1900]}
  };
  const vowels=[[730,1090,2440],[270,2290,3010],[300,870,2240],[530,1840,2480],[570,840,2410]];
  const phrase=[0,2,1,4,3,1,2,0,4];
  function envelope(t,duration,attack=.006){
    if(t<=0||t>=duration) return 0;
    return Math.min(1,t/attack)*Math.pow(Math.sin(Math.PI*t/duration),.65);
  }
  // Both object effects use the same soft bandwidth and perceived level.
  // Each is a single gesture: a wooden rebound or a continuous leaf brush.
  function objectSound(kind){
    const wood=kind==="wood",duration=wood?.34:.48;
    const samples=new Float32Array(Math.ceil(duration*RATE));
    let phase=0;
    let seed=173,noiseFast=0,noiseSlow=0,low=0,bass=0;
    const cutoff=1-Math.exp(-2*Math.PI*1700/RATE);
    const highpass=1-Math.exp(-2*Math.PI*120/RATE);
    for(let i=0;i<samples.length;i++){
      const t=i/RATE,u=t/duration;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      const noise=seed/4294967296*2-1;
      noiseFast+=.24*(noise-noiseFast);noiseSlow+=.06*(noise-noiseSlow);
      const brush=noiseFast-noiseSlow;
      let source=brush;
      if(wood){
        // One small, rounded plop; no separate thump or noisy after-hit.
        phase+=2*Math.PI*(310+75*Math.exp(-t*18))/RATE;
        source=Math.sin(phase)*.5+Math.sin(phase*2)*.035;
      }
      low+=cutoff*(source-low);bass+=highpass*(low-bass);
      const gesture=envelope(t,duration,.035)*Math.exp(-u*2);
      samples[i]=(low-bass)*gesture;
    }
    let energy=0,peak=0;
    for(const sample of samples){energy+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
    const gain=Math.min(.024/Math.sqrt(energy/samples.length),.13/peak);
    for(let i=0;i<samples.length;i++) samples[i]*=gain;
    samples[0]=0;samples[samples.length-1]=0;
    return samples;
  }
  // Original warm membrane strikes. A short preparation hit and a fuller resonant hit.
  function chapterDrum(full){
    const duration=full?1.85:.30,samples=new Float32Array(Math.ceil(duration*RATE));
    let phase=0,seed=491,noise=0;
    for(let i=0;i<samples.length;i++){
      const t=i/RATE;phase+=2*Math.PI*((full?62:82)+35*Math.exp(-t*24))/RATE;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise+=.08*(seed/4294967296*2-1-noise);
      const attack=Math.min(1,t/.012),tail=Math.pow(Math.max(0,1-t/duration),1.5);
      const body=(Math.sin(phase)+.30*Math.sin(phase*1.58)+.13*Math.sin(phase*2.14))*Math.exp(-t*(full?2.1:8));
      const room=full?.16*Math.sin(2*Math.PI*58*t)*Math.exp(-t*1.5)*Math.min(1,t/.13):0;
      samples[i]=(body*.38+noise*.32*Math.exp(-t*30)+room)*attack*tail;
    }
    samples[0]=0;samples[samples.length-1]=0;return samples;
  }
  // Two original, dry wooden taps for the porch door.
  function doorKnock(){
    const samples=new Float32Array(Math.ceil(.65*RATE));let seed=1341,noise=0;
    for(const offset of [.015,.245])for(let i=0;i<Math.ceil(.18*RATE);i++){
      const t=i/RATE;seed=(Math.imul(seed,1664525)+1013904223)>>>0;noise+=.18*(seed/2147483648-1-noise);
      const attack=Math.min(1,t/.005),tail=Math.pow(Math.max(0,1-t/.18),2)*Math.exp(-t*14);
      const body=Math.sin(2*Math.PI*215*t)+.35*Math.sin(2*Math.PI*347*t)+noise*.6;
      samples[Math.round(offset*RATE)+i]+=body*.25*attack*tail;
    }
    samples[0]=0;samples[samples.length-1]=0;return samples;
  }
  function render(kind,target="",syllableIndex=null){
    if(kind==="knock")return doorKnock();
    if(kind==="chapter-first"||kind==="chapter-second")return chapterDrum(kind==="chapter-second");
    if(kind==="wood"||kind==="rustle") return objectSound(kind);
    const voice=voices[kind];
    if(!voice) return new Float32Array(0);
    const single=Number.isInteger(syllableIndex)&&syllableIndex>=0;
    const duration=(single?1:phrase.length)*(voice.duration+voice.gap)+.11;
    const samples=new Float32Array(Math.ceil(duration*RATE));
    {
      let offset=0;
      for(let step=0;step<(single?1:phrase.length);step++){
        const syllable=single?syllableIndex%phrase.length:step;
        const length=voice.duration*(syllable%3===1?.96:1.02);
        const vowel=vowels[phrase[syllable]];
        const formants=voice.formants.map((f,index)=>f*(1+(vowel[index]/vowels[0][index]-1)*.025));
        let phase=0;
        const base=voice.pitch;
        const weights=Array.from({length:Math.min(28,Math.floor(RATE*.45/(base*1.055)))},(_,h)=>{
          const frequency=(h+1)*base;
          // Keep one stable fundamental; small vowel colours do not jump in pitch.
          const source=h===0?voice.fundamental:voice.brightness/Math.pow(h+1,1.3);
          return source+formants.reduce((sum,f,index)=>sum+[.4,.1,.03][index]*Math.exp(-.5*Math.pow((frequency-f)/(index===0?175:250),2)),0)/Math.sqrt(h+1);
        });
        const scale=voice.level/weights.reduce((sum,w)=>sum+w,0);
        for(let i=0;i<Math.ceil(length*RATE);i++){
          const t=i/RATE;
          phase+=2*Math.PI*base/RATE;
          let sample=0;
          for(let h=0;h<weights.length;h++) sample+=weights[h]*Math.sin(phase*(h+1));
          samples[offset+i]+=sample*scale*envelope(t,length,voice.attack);
        }
        offset+=Math.ceil((length+voice.gap+(syllable===3?.048:0))*RATE);
      }
    }
    return samples;
  }
  function effectKind(target){return ({"door-knock":"knock",house:"wood",bush:"rustle","chapter-first":"chapter-first","chapter-second":"chapter-second"})[target]??"none";}
  const api=Object.freeze({sampleRate:RATE,render,effectKind});
  if(typeof module!=="undefined"&&module.exports) module.exports=api;
  else window.PixelySounds=api;
})();
