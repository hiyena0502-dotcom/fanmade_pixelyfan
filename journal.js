(()=>{"use strict";
const hints=[
  {id:"decorations",text:"문구랑 스티커랑 뭐 이것저것 있어. 보면 알아~"},
  {id:"ttoni",text:"아, 또니도 한번 찾아봐. 걔한테 하나 있을걸?"},
  {id:"tt",text:"근데 걔 발견하면 티티부터 불러ㅋㅋ 또 어디 숨어서 쉬고 있을걸?"}
];
function notes(save){
  const heard=new Set(Array.isArray(save?.heardHints)?save.heardHints:[]);
  // Earlier saves marked this branch only after all six supplied lines were read.
  if(save?.answeredDecorationChoices?.includes(0)) hints.forEach(h=>heard.add(h.id));
  return hints.filter(h=>heard.has(h.id));
}
function availableHints(save){
  if(save?.decorationQuest!=="accepted") return [];
  return [{id:"request",text:"돌아다니다가 요정들 보이면 장식만 좀 받아와 줄 수 있어?"},...notes(save)];
}
function revision(save){return save?.decorationQuest==="accepted"?"request":""}
function log(save){
  return (Array.isArray(save?.dialogueLog)?save.dialogueLog:[]).filter(e=>e&&typeof e.text==="string"&&typeof e.member==="string").slice(-200);
}
function record(save,line){
  const previous=log(save),last=previous.at(-1);
  const dialogueLog=last?.member===line.member&&last.text===line.text?previous:[...previous,{member:line.member,text:line.text}].slice(-200);
  const heardHints=[...new Set([...notes(save).map(h=>h.id),...hints.filter(h=>h.text===line.text).map(h=>h.id)])];
  return {dialogueLog,heardHints};
}
window.PixelyJournal={notes,availableHints,revision,log,record};
})();
