(()=>{"use strict";
const $=q=>document.querySelector(q);
const gongryong=text=>({member:"gongryong",text});
const rader=text=>({member:"rader",text});
const deokgae=text=>({member:"deokgae",text});
// User-approved dialogue. Directions are expressed through the presentation.
const opening=[
  gongryong("어, 왔네?"),
  gongryong("잘 왔어! 안 그래도 지금 사람 하나 필요했는데..."),
  rader("사람은 많은데?"),
  gongryong("쓸 수 있는 사람이 필요하다고."),
  rader("와."),
  gongryong("아니, 요정들한테 생일 장식 몇 개 맡겨놨거든? 근데 아직 하나도 안 왔어!!"),
  gongryong("요정들은 뭐… 알아서 오겠지."),
  deokgae("야, 정형준!"),
  gongryong("왜!"),
  deokgae("너 아까 주방에 뭐 두고 갔냐?"),
  gongryong("뭔데?"),
  deokgae("그걸 내가 알면 널 왜 불러!"),
  rader("그건 맞지ㅋㅋ"),
  gongryong("크흠. 아무튼!"),
  gongryong("어차피 집 좀 둘러볼 거지?"),
  gongryong("돌아다니다가 요정들 보이면 장식만 좀 받아와 줄 수 있어?"),
  gongryong("이미 다 준비는 해놨다는데, 왜 아무도 안 갖다주는지는 나도 몰라.")
];
const choices=[
  // No separate answer was supplied for this choice: reuse the approved explanation.
  {label:"어떤 장식인데요?",lines:[opening[5],opening[16]]},
  {label:"요정분들은 어디 계세요?",lines:[gongryong("그걸 알았으면 내가 갔다 왔지."),rader("진짜 당당하다.")]},
  {label:"결국 제가 찾으러 가는 거네요.",lines:[gongryong("그렇게 말하면 되게 시킨 것 같잖아!"),gongryong("…집 구경도 하고. 장식도 받고. 얼마나 좋아~")]}
];
const names={gongryong:"공룡",rader:"라더",deokgae:"덕개"};
const ui=$("#story-dialogue-ui");
let state=null,onProgress=()=>{},onComplete=()=>{};
function normalize(saved){
  if(!saved||!["opening","choices","reply"].includes(saved.phase)) return {phase:"opening",index:0,choice:null};
  if(saved.phase==="choices") return {phase:"choices",index:0,choice:null};
  const choice=Number.isInteger(saved.choice)&&choices[saved.choice]?saved.choice:null;
  const lines=saved.phase==="opening"?opening:choices[choice]?.lines;
  if(!lines||!Number.isInteger(saved.index)||saved.index<0||saved.index>=lines.length) return {phase:"opening",index:0,choice:null};
  return {phase:saved.phase,index:saved.index,choice};
}
function snapshot(){return {...state}}
function lastMain(){
  if(state.phase==="opening") return opening.slice(0,state.index+1).filter(l=>l.member==="gongryong").at(-1);
  if(state.phase==="reply") return choices[state.choice].lines.slice(0,state.index+1).filter(l=>l.member==="gongryong").at(-1)||opening.at(-1);
  return opening.at(-1);
}
function render(){
  const picking=state.phase==="choices";
  const line=picking?null:(state.phase==="opening"?opening:choices[state.choice].lines)[state.index];
  const interruption=!picking&&line.member!=="gongryong";
  $("#dialogue-text").textContent=lastMain().text;
  $("#dialogue-speaker").textContent=names.gongryong;
  $("#dialogue-next").disabled=picking;
  $("#dialogue-next").setAttribute("aria-label",picking?"대답을 선택해 주세요":"다음 대사");
  $("#dialogue-interruption").hidden=!interruption;
  if(interruption){
    $("#dialogue-interruption").dataset.member=line.member;
    $("#interruption-name").textContent=names[line.member];
    $("#interruption-place").textContent=line.member==="deokgae"?"주방 쪽에서":"";
    $("#interruption-text").textContent=line.text;
  }
  $("#dialogue-choices").hidden=!picking;
  $("#dialogue-choices").replaceChildren();
  if(picking){
    choices.forEach((choice,index)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=choice.label;
      button.addEventListener("click",()=>{
        state={phase:"reply",index:0,choice:index};
        onProgress(snapshot());render();$("#dialogue-next").focus({preventScroll:true});
      });
      $("#dialogue-choices").appendChild(button);
    });
    $("#dialogue-choices").querySelector("button")?.focus({preventScroll:true});
  }
}
function advance(){
  if(!state||state.phase==="choices") return;
  const lines=state.phase==="opening"?opening:choices[state.choice].lines;
  if(state.index+1<lines.length) state.index++;
  else if(state.phase==="opening") state={phase:"choices",index:0,choice:null};
  else {close();onComplete();return}
  onProgress(snapshot());render();
}
function close(){ui.hidden=true;state=null;$("#dialogue-interruption").hidden=true;$("#dialogue-choices").hidden=true}
function open({saved=null,repeat=false,progress=()=>{},complete=()=>{}}={}){
  state=normalize(saved||(repeat?{phase:"opening",index:14}:null));
  onProgress=progress;onComplete=complete;
  ui.hidden=false;onProgress(snapshot());render();
  if(state.phase!=="choices") $("#dialogue-next").focus({preventScroll:true});
}
$("#dialogue-next").addEventListener("click",advance);
$("#interruption-next").addEventListener("click",advance);
document.addEventListener("keydown",event=>{
  if(!state||event.repeat) return;
  if(state.phase==="choices"){
    if(event.key==="Tab"){
      const buttons=[...$("#dialogue-choices").querySelectorAll("button")];
      const first=buttons[0],last=buttons.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
    return;
  }
  if(event.code==="Space"||event.code==="Enter") {event.preventDefault();advance()}
  if(event.key==="Tab"){event.preventDefault();$("#dialogue-next").focus({preventScroll:true})}
});
function fitPortrait(image){
  if(!image.naturalWidth) return;
  try{
    const scale=Math.min(1,512/image.naturalWidth,512/image.naturalHeight);
    const canvas=document.createElement("canvas");canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);
    const context=canvas.getContext("2d",{willReadFrequently:true});if(!context)return;
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
    let left=canvas.width,top=canvas.height,right=-1,bottom=-1;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>8){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
    if(right<left)return;
    const width=right-left+1,height=bottom-top+1,frame=image.parentElement;
    frame.style.aspectRatio=width+" / "+height;
    frame.parentElement.style.aspectRatio=width+" / "+height;
    for(const [key,value] of Object.entries({left:-left/width*100,top:-top/height*100,width:canvas.width/width*100,height:canvas.height/height*100}))frame.style.setProperty("--portrait-"+key,value+"%");
  }catch{/* Keep CSS framing if alpha measurement is unavailable. */}
}
document.querySelectorAll("[data-member-image]").forEach(image=>{image.addEventListener("load",()=>fitPortrait(image));if(image.complete)fitPortrait(image)});
window.PixelyDialogue={open,close,isOpen:()=>Boolean(state)};
})();
