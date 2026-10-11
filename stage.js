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
    const frame=screen==='game'&&playing?api.gameFit(w,h):api.fit(w,h);
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
  function fit(viewWidth,viewHeight,baseWidth=width,baseHeight=height){
    const w=Math.max(0,Number(viewWidth)||0),h=Math.max(0,Number(viewHeight)||0);
    const width=baseWidth,height=baseHeight,scale=Math.min(w/width,h/height);
    return {width,height,scale,displayWidth:width*scale,displayHeight:height*scale,
      left:(w-width*scale)/2,top:(h-height*scale)/2};
  }
  // Main/menu and play coordinates are independent; saved normalized positions stay intact.
  function homeFit(viewWidth,viewHeight){return fit(viewWidth,viewHeight);}
  function gameFit(viewWidth,viewHeight){return fit(viewWidth,viewHeight,1920,1080);}
  function uiFit(frame){
    const zoom=Math.max(1,Math.min(1.18/Math.max(frame.scale,.001),frame.width/1200,frame.height/800));
    return {zoom,width:frame.width/zoom,height:frame.height/zoom};
  }
  return {width,height,gameWidth:1920,gameHeight:1080,fit,homeFit,gameFit,uiFit};
});
