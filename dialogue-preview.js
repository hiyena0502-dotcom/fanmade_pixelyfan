(()=>{"use strict";
const character=document.querySelector("#talk-gongryong");
function begin(){
  character.inert=true;
  window.PixelyDialogue.open({complete:()=>{character.inert=false;character.focus({preventScroll:true})}});
}
character.addEventListener("click",begin);
begin();
})();
