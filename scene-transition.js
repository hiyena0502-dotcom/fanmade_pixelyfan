'use strict';
(function(root){
  function create(ImageType=root.Image){
    const cache=new Map();
    function load(src){
      if(!src)return Promise.resolve();
      if(cache.has(src))return cache.get(src);
      const task=new Promise((resolve,reject)=>{
        const image=new ImageType();
        const timer=setTimeout(()=>reject(Error('장면 이미지 로딩 시간이 길어지고 있어요 · 다시 시도해 주세요')),20000);
        const done=fn=>{clearTimeout(timer);image.onload=image.onerror=null;fn();};
        image.onload=()=>{Promise.resolve(image.decode?.()).then(()=>done(resolve),()=>done(resolve));};
        image.onerror=()=>done(()=>reject(Error('장면 이미지를 불러오지 못했어요 · 연결을 확인하고 다시 시도해 주세요')));
        image.src=src;
      });
      cache.set(src,task);task.catch(()=>cache.delete(src));return task;
    }
    return {prepare:sources=>Promise.all([...new Set(sources.filter(Boolean))].map(load))};
  }
  const api={create};if(typeof module!=='undefined')module.exports=api;else root.PixelySceneTransition=api;
})(typeof window!=='undefined'?window:globalThis);
