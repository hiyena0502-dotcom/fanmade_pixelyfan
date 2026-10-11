(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(!root?.document)return;
  const html=root.document.documentElement;
  let playing=false;
  function setPlaying(value){playing=!!value;html.classList.toggle('pixely-game-playing',playing);resize();}
  function resize(){
    const w=html.clientWidth||root.innerWidth,h=html.clientHeight||root.innerHeight;
    const screen=html.dataset.screen;
    const frame=screen==='home'||screen==='ui'||(screen==='game'&&!playing)?api.homeFit(w,h):api.fit(w,h);
    const ui=api.uiFit(frame);
    html.style.setProperty('--stage-width',frame.width+'px');
    html.style.setProperty('--stage-height',frame.height+'px');
    html.style.setProperty('--stage-vw',frame.width/100+'px');
    html.style.setProperty('--stage-vh',frame.height/100+'px');
    html.style.setProperty('--ui-zoom',String(ui.zoom));
    html.style.setProperty('--ui-vw',ui.width/100+'px');
    html.style.setProperty('--ui-vh',ui.height/100+'px');
    html.style.setProperty('--stage-scale',String(frame.scale));
    root.PixelyStage={...api,frame,setPlaying};
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
  function homeFit(viewWidth,viewHeight){
    const w=Math.max(1,Number(viewWidth)||1),h=Math.max(1,Number(viewHeight)||1);
    const scale=Math.min(1,w/1200,h/720);
    return {width:w/scale,height:h/scale,scale,displayWidth:w,displayHeight:h,left:0,top:0};
  }
  function uiFit(frame){
    const zoom=Math.max(1,Math.min(1.18/Math.max(frame.scale,.001),frame.width/1200,frame.height/800));
    return {zoom,width:frame.width/zoom,height:frame.height/zoom};
  }
  return {width,height,fit,homeFit,uiFit};
});
