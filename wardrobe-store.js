"use strict";
(() => {
  const DB="pixely-dressup-store",LEGACY="pixely-dressup-editor-v1";
  function open(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){reject(new Error("이 브라우저에서는 옷장 저장을 사용할 수 없어요"));return;}
      const request=indexedDB.open(DB,2);
      request.onupgradeneeded=()=>{
        for(const name of ["images","looks","metadata"])if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name);
      };
      request.onerror=()=>reject(request.error);
      request.onblocked=()=>reject(new Error("다른 옷장 탭을 닫고 다시 열어 주세요"));
      request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};
    });
  }
  function transaction(db,names,mode,work){
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(names,mode);let result;
      tx.oncomplete=()=>resolve(typeof result==="function"?result():result);
      tx.onabort=()=>reject(tx.error||new Error("옷장을 저장하지 못했어요"));
      tx.onerror=()=>{};
      try{result=work(tx);}catch(error){tx.abort();reject(error);}
    });
  }
  async function readWorkspace(db){
    return transaction(db,["images","metadata"],"readonly",tx=>{
      const state=tx.objectStore("metadata").get("state"),keys=tx.objectStore("images").getAllKeys(),blobs=tx.objectStore("images").getAll();
      return ()=>{
        let legacy=null;try{legacy=JSON.parse(localStorage.getItem(LEGACY));}catch{}
        return {state:state.result||legacy,images:new Map(keys.result.map((key,index)=>[key,blobs.result[index]]))};
      };
    });
  }
  const writeWorkspace=(db,state,updates=[],removed=[])=>transaction(db,["images","metadata"],"readwrite",tx=>{
    tx.objectStore("metadata").put(structuredClone(state),"state");
    for(const [key,blob]of updates)tx.objectStore("images").put(blob,key);
    for(const key of removed)tx.objectStore("images").delete(key);
  });
  const readSlots=db=>transaction(db,"looks","readonly",tx=>{
    const req=tx.objectStore("looks").getAll(),keys=tx.objectStore("looks").getAllKeys();
    return ()=>new Map(keys.result.map((key,index)=>[Number(key),req.result[index]]));
  });
  function writeSlot(db,index,snapshot){
    if(!Number.isInteger(index)||index<0||index>=5)return Promise.reject(new Error("저장 슬롯은 1부터 5까지 사용할 수 있어요"));
    return transaction(db,"looks","readwrite",tx=>tx.objectStore("looks").put(snapshot,index));
  }
  const clearSlot=(db,index)=>transaction(db,"looks","readwrite",tx=>tx.objectStore("looks").delete(index));
  window.WardrobeStore=Object.freeze({open,readWorkspace,writeWorkspace,readSlots,writeSlot,clearSlot});
})();
