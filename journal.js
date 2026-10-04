(()=>{"use strict";
function revision(save){return save?.decorationQuest==="accepted"?"request":""}
function log(save){
  return (Array.isArray(save?.dialogueLog)?save.dialogueLog:[]).filter(e=>e&&typeof e.text==="string"&&typeof e.member==="string").slice(-200);
}
function record(save,line){
  const previous=log(save),last=previous.at(-1);
  const dialogueLog=last?.member===line.member&&last.text===line.text?previous:[...previous,{member:line.member,text:line.text}].slice(-200);
  return {dialogueLog};
}
window.PixelyJournal={revision,log,record};
})();
