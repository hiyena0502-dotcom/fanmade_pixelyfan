(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root?.document)return;
  const html=root.document.documentElement;
  function resize(){
    const frame=api.fit(html.clientWidth||root.innerWidth,html.clientHeight||root.innerHeight);
    html.style.setProperty('--stage-scale',String(frame.scale));
    root.PixelyStage={...api,frame};
  }
  html.classList.add('pixely-stage-ready');
  resize();
  root.addEventListener('resize',resize);
  root.addEventListener('pageshow',resize);
})(typeof window==='object'?window:null,function(){
  const width=3000,height=1440;
  function fit(viewWidth,viewHeight){
    const w=Math.max(0,Number(viewWidth)||0),h=Math.max(0,Number(viewHeight)||0);
    const scale=Math.min(w/width,h/height);
    return {width,height,scale,displayWidth:width*scale,displayHeight:height*scale,
      left:(w-width*scale)/2,top:(h-height*scale)/2};
  }
  return {width,height,fit};
});
