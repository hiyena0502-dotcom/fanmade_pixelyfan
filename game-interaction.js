(()=>{"use strict";
  const editable="input,textarea,select,[contenteditable]:not([contenteditable=\"false\"])";
  const isEditable=node=>node instanceof Element&&Boolean(node.closest(editable));
  const canEdit=event=>isEditable(event.target)||(!(event.target instanceof Element)&&isEditable(document.activeElement));
  const blockDocumentAction=event=>{
    if(!canEdit(event)) event.preventDefault();
  };
  for(const name of ["dragstart","drop","dragover","selectstart","copy","cut","paste","contextmenu"]){
    document.addEventListener(name,blockDocumentAction);
  }
  document.addEventListener("keydown",event=>{
    if((event.ctrlKey||event.metaKey)&&!event.altKey&&["a","c","x","v"].includes(event.key.toLowerCase())){
      blockDocumentAction(event);
    }
  });
})();
