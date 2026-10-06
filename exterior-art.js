/* Original 2048 × 1152 transparent layers supplied by the artist. */
(function(g){
  const layers=['sky','mountains','fence','house','lawn','garden-bushes','house-flowers','garden-props','vegetable-bed','grass-details','foreground-flowers','laundry','blue-butterfly','bird','door-critter'];
  const path=(name,index)=>'assets/story/exterior-v175/'+String(index+1).padStart(2,'0')+'-'+name+'.png';
  function create({decorative=false}={}){
    const art=document.createElement('div');art.className='exterior-composition';
    art.setAttribute('role','img');art.setAttribute('aria-label','푸른 하늘 아래 꽃과 정원, 빨랫감과 새집이 있는 픽셀리 집');
    if(decorative)art.setAttribute('aria-hidden','true');
    layers.forEach((name,index)=>{
      const img=document.createElement('img');img.className='exterior-layer exterior-layer--'+name;
      img.src=g.PixelyAsset?g.PixelyAsset(path(name,index)):path(name,index);img.alt='';img.draggable=false;img.setAttribute('aria-hidden','true');
      art.append(img);
      if(index===0){const clouds=document.createElement('div');clouds.className='exterior-clouds';clouds.setAttribute('aria-hidden','true');
        for(let i=0;i<4;i++){const cloud=document.createElement('span');cloud.className='painted-cloud';cloud.style.setProperty('--cloud-index',String(i));clouds.append(cloud)}art.append(clouds)}
    });return art;
  }
  g.PixelyExterior={create,layers,path};
})(window);
