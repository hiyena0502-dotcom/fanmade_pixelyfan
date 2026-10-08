"use strict";

(() => {
  const dialog=document.querySelector("#collection-dialog");
  const button=document.querySelector('[data-action="collection"]');
  button.addEventListener("click",()=>{
    if(dialog.open) return;
    dialog.showModal();dialog.querySelector("[data-close-collection]").focus({preventScroll:true});
  });
  dialog.querySelectorAll("[data-close-collection]").forEach(close=>close.addEventListener("click",()=>dialog.close()));
  dialog.addEventListener("close",()=>button.focus({preventScroll:true}));
  dialog.addEventListener("click",event=>{
    if(event.target!==dialog) return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) dialog.close();
  });
})();
