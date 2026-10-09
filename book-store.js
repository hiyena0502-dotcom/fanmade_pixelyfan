"use strict";
(() => {
  const DB="pixely-adventure-books";
  function open(){return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error("브라우저 저장 공간을 사용할 수 없어요"));return;}
    const req=indexedDB.open(DB,1);
    req.onupgradeneeded=()=>{for(const store of ["metadata","progress","images","view"])req.result.createObjectStore(store);};
    req.onerror=()=>reject(req.error);req.onblocked=()=>reject(new Error("다른 책 편집 탭을 닫고 다시 열어 주세요"));
    req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();resolve(req.result);};
  });}
  function transaction(db,names,mode,work){return new Promise((resolve,reject)=>{
    const tx=db.transaction(names,mode);let result;
    tx.oncomplete=()=>resolve(typeof result==="function"?result():result);tx.onabort=()=>reject(tx.error||new Error("저장하지 못했어요"));tx.onerror=()=>{};
    try{result=work(tx);}catch(error){tx.abort();reject(error);}
  });}
  const read=db=>transaction(db,["metadata","progress","images","view"],"readonly",tx=>{
    const metadata=tx.objectStore("metadata").get("catalogue"),progress=tx.objectStore("progress").get("game"),view=tx.objectStore("view").get("book"),keys=tx.objectStore("images").getAllKeys(),images=tx.objectStore("images").getAll();
    return ()=>({catalogue:metadata.result,progress:progress.result,view:view.result,images:new Map(keys.result.map((key,i)=>[key,images.result[i]]))});
  });
  const writeCatalogue=(db,catalogue,updates=[],removed=[])=>transaction(db,["metadata","images"],"readwrite",tx=>{
    tx.objectStore("metadata").put(catalogue,"catalogue");for(const [key,image]of updates)tx.objectStore("images").put(image,key);for(const key of removed)tx.objectStore("images").delete(key);
  });
  const writeProgress=(db,progress)=>transaction(db,"progress","readwrite",tx=>tx.objectStore("progress").put(progress,"game"));
  const writeRecord=(db,catalogue,progress,updates=[],removed=[])=>transaction(db,["metadata","progress","images"],"readwrite",tx=>{
    tx.objectStore("metadata").put(catalogue,"catalogue");tx.objectStore("progress").put(progress,"game");
    for(const [key,image]of updates)tx.objectStore("images").put(image,key);for(const key of removed)tx.objectStore("images").delete(key);
  });
  const writeView=(db,view)=>transaction(db,"view","readwrite",tx=>tx.objectStore("view").put(view,"book"));
  window.PixelyBookStore=Object.freeze({DB,open,read,writeCatalogue,writeProgress,writeRecord,writeView});
})();
