(()=>{"use strict";
  // Swapping this single asset keeps the member's dialogue design intact.
  const members={gongryong:{name:"공룡",portrait:"assets/characters/gongryong-placeholder.png"}};
  const root=document.querySelector(".dialogue-preview");
  const member=members[root.dataset.member];
  const image=document.querySelector("#member-portrait");
  image.src=member.portrait;
  image.alt=member.name+"의 임시 캐릭터 이미지";
  document.querySelector("#speaker-name").textContent=member.name;

  // Measure transparency without changing the source, so replacement portraits fit too.
  function fitPortrait(){
    if(!image.naturalWidth) return;
    try{
      const ratio=Math.min(1,512/image.naturalWidth,512/image.naturalHeight);
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
      const context=canvas.getContext("2d",{willReadFrequently:true});
      if(!context) return;
      context.drawImage(image,0,0,canvas.width,canvas.height);
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
      for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
        if(pixels[(y*canvas.width+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
      }
      if(right<left) return;
      const width=right-left+1,height=bottom-top+1,frame=image.parentElement;
      frame.style.aspectRatio=width+" / "+height;
      frame.style.setProperty("--portrait-left",-left/width*100+"%");
      frame.style.setProperty("--portrait-top",-top/height*100+"%");
      frame.style.setProperty("--portrait-width",canvas.width/width*100+"%");
      frame.style.setProperty("--portrait-height",canvas.height/height*100+"%");
    }catch{/* The original portrait remains visible if measurement is unavailable. */}
  }
  image.addEventListener("load",fitPortrait);
  if(image.complete) fitPortrait();
})();
