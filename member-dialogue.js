(()=>{"use strict";
const $=q=>document.querySelector(q);
const gongryong=text=>({member:"gongryong",text});
const rader=text=>({member:"rader",text});
const deokgae=text=>({member:"deokgae",text});
const dreamer=text=>({member:"dreamer",text});
// User-approved dialogue. Directions are expressed through the presentation.
const opening=[
  gongryong("어, 왔네?"),
  gongryong("잘 왔어! 안 그래도 지금 사람 하나 필요했는데..."),
  rader("사람은 많은데?"),
  gongryong("쓸 수 있는 사람이 필요하다고."),
  rader("와."),
  gongryong("아니, 요정들한테 생일 장식 몇 개 맡겨놨거든? 근데 아직 하나도 안 왔어!!"),
  dreamer("요정분들도 아직 안 오신 거예요?"),
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
const repeatOpening=[
  gongryong("왜, 벌써 찾았어?"),
  gongryong("아니면 어디 있는지 물어보려고?"),
  gongryong("나도 몰라~ 그러니까 부탁한 거지.")
];
const choices=[
  {label:"어떤 장식인데요?",lines:[
    gongryong("문구랑 스티커랑 뭐 이것저것 있어. 보면 알아~"),
    gongryong("아, 또니도 한번 찾아봐. 걔한테 하나 있을걸?"),
    gongryong("근데 걔 발견하면 티티부터 불러ㅋㅋ 또 어디 숨어서 쉬고 있을걸?"),
    rader("왜 장식 찾으러 갔다가 또니까지 잡아와."),
    gongryong("잡아오랬냐? 위치만 불라고 했지."),
    gongryong("이것도 엄밀히 따지면 사장님한테 아부하는 일의 연장선이라고~")
  ]},
  {label:"요정분들은 어디 계세요?",lines:[gongryong("그걸 알았으면 내가 갔다 왔지."),rader("진짜 당당하다.")]},
  {label:"결국 제가 찾으러 가는 거네요.",lines:[gongryong("그렇게 말하면 되게 시킨 것 같잖아!"),gongryong("…집 구경도 하고. 장식도 받고. 얼마나 좋아~")]}
];
// Room placement and conversation portraits are independent assets. Replace here only
// to change the conversation image; the room image lives in index.html.
const members={
  gongryong:{name:"공룡",portrait:"assets/characters/gongryong-placeholder.png"},
  rader:{name:"라더",portrait:null},
  deokgae:{name:"덕개",portrait:null},
  dreamer:{name:"꿈뜰이",portrait:null},
  unknown:{name:"???",portrait:null},
  stage:{name:"",portrait:null}
};
const ui=$("#story-dialogue-ui");
let state=null,onProgress=()=>{},onComplete=()=>{},onLine=()=>{},lastLoggedKey=null;
let readChoices=new Set();
let sequence=null,sequenceTimer=0,sequencePaused=false,sequenceDeadline=0,remainingDelay=0;
function normalize(saved){
  if(!saved||!["opening","repeat","choices","reply"].includes(saved.phase)) return {phase:"opening",index:0,choice:null};
  if(saved.phase==="choices") return {phase:"choices",index:0,choice:null,repeat:Boolean(saved.repeat)};
  const choice=Number.isInteger(saved.choice)&&choices[saved.choice]?saved.choice:null;
  const lines=saved.phase==="opening"?opening:saved.phase==="repeat"?repeatOpening:choices[choice]?.lines;
  // Keep pre-insertion saves on the same line, including kitchen interruptions.
  let index=saved.index;
  if(saved.phase==="opening"&&saved.revision!==2&&index>=6&&index<17) index++;
  if(!lines||!Number.isInteger(index)||index<0||index>=lines.length) return {phase:"opening",index:0,choice:null};
  return {phase:saved.phase,index,choice};
}
function snapshot(){return {...state,revision:2}}
function lastMain(){
  if(sequence) return sequence.lines[Math.min(state.index,sequence.lines.length-1)];
  if(state.phase==="opening") return opening.slice(0,state.index+1).filter(l=>l.member!=="deokgae").at(-1);
  if(state.phase==="repeat") return repeatOpening[state.index];
  if(state.phase==="reply") return choices[state.choice].lines.slice(0,state.index+1).filter(l=>l.member!=="deokgae").at(-1)||opening.at(-1);
  return state.repeat?repeatOpening.at(-1):opening.at(-1);
}
function render(){
  const picking=state.phase==="choices"||state.phase==="scene-choices";
  const line=picking?null:sequence?lastMain():(state.phase==="opening"?opening:state.phase==="repeat"?repeatOpening:choices[state.choice].lines)[state.index];
  const interruption=!picking&&line.member==="deokgae";
  ui.dataset.interruption=interruption?"true":"false";
  const loggedKey=state.phase+":"+state.choice+":"+state.index;
  if(!picking&&loggedKey!==lastLoggedKey){lastLoggedKey=loggedKey;onLine(line)}
  const mainLine=lastMain(),member=members[mainLine.member];
  ui.dataset.speaker=mainLine.member;
  ui.setAttribute("aria-label",member.name?member.name+"의 대화":"상황 묘사");
  $("#dialogue-text").textContent=mainLine.text;
  $("#dialogue-speaker").textContent=member.name;
  document.querySelectorAll("[data-motif]").forEach(motif=>{
    if(motif.dataset.motif===mainLine.member) motif.removeAttribute("hidden");
    else motif.setAttribute("hidden","");
  });
  const portrait=$("#dialogue-portrait"),image=$("#dialogue-portrait-image");
  portrait.hidden=!member.portrait;
  if(member.portrait){
    if(image.getAttribute("src")!==member.portrait) image.src=member.portrait;
    image.alt="대화 중인 "+member.name;
  }
  const waiting=Boolean(sequence&&!picking&&mainLine.delay);
  $("#dialogue-next").disabled=picking||waiting||interruption;
  $("#dialogue-next").setAttribute("aria-label",picking?"대답을 선택해 주세요":waiting?"잠시 기다려 주세요":"다음 대사");
  $("#dialogue-interruption").hidden=!interruption;
  $(".story-frame")?.classList.toggle("is-talking",true);
  if(interruption){
    $("#dialogue-interruption").dataset.member=line.member;
    $("#interruption-name").textContent=members[line.member].name;
    $("#interruption-place").textContent=line.member==="deokgae"?"주방 쪽에서":"";
    $("#interruption-text").textContent=line.text;
  }
  $("#dialogue-choices").hidden=!picking;
  $("#dialogue-choices").replaceChildren();
  if(picking){
    (sequence?sequence.choices:choices).forEach((choice,index)=>{
      const button=document.createElement("button");
      button.type="button";button.textContent=choice.label;
      button.classList.toggle("is-read",!sequence&&readChoices.has(index));
      if(!sequence&&readChoices.has(index)) button.setAttribute("aria-label",choice.label+" (이미 읽은 대화)");
      button.addEventListener("click",()=>{
        if(!state)return;
        onLine({member:"dreamer",text:choice.label});
        if(sequence){const callback=sequence.choose;close();callback(index);return}
        state={phase:"reply",index:0,choice:index};
        onProgress(snapshot());render();
      });
      $("#dialogue-choices").appendChild(button);
    });
    $("#dialogue-choices").querySelector("button")?.focus({preventScroll:true});
  }
  if(!picking&&!waiting) (interruption?$("#interruption-next"):$("#dialogue-next")).focus({preventScroll:true});
}
function advance(){
  if(!state||sequencePaused||state.phase==="choices"||state.phase==="scene-choices") return;
  if(sequence){
    clearTimeout(sequenceTimer);
    if(state.index+1<sequence.lines.length) state.index++;
    else if(sequence.choices.length) state.phase="scene-choices";
    else {const callback=onComplete;close();callback();return}
    onProgress(snapshot());render();scheduleSequence();return;
  }
  const lines=state.phase==="opening"?opening:state.phase==="repeat"?repeatOpening:choices[state.choice].lines;
  if(state.index+1<lines.length) state.index++;
  else if(state.phase==="opening"||state.phase==="repeat") state={phase:"choices",index:0,choice:null,repeat:state.phase==="repeat"};
  else {const choice=state.choice;close();onComplete({choice});return}
  onProgress(snapshot());render();
}
function close(){clearTimeout(sequenceTimer);sequenceTimer=0;sequencePaused=false;remainingDelay=0;sequence=null;ui.hidden=true;$(".story-frame")?.classList.remove("is-talking");$("#dialogue-portrait").hidden=true;state=null;$("#dialogue-interruption").hidden=true;$("#dialogue-choices").hidden=true}
function open({saved=null,repeat=false,answeredChoices=[],progress=()=>{},complete=()=>{},line=()=>{}}={}){
  sequence=null;clearTimeout(sequenceTimer);
  lastLoggedKey=null;
  readChoices=new Set((Array.isArray(answeredChoices)?answeredChoices:[]).filter(choice=>Number.isInteger(choice)&&choices[choice]));
  state=normalize(saved||(repeat?{phase:"repeat",index:0}:null));
  onProgress=progress;onComplete=complete;onLine=line;
  ui.hidden=false;onProgress(snapshot());render();
  if(state.phase!=="choices") (ui.dataset.interruption==="true"?$("#interruption-next"):$("#dialogue-next")).focus({preventScroll:true});
}
$("#dialogue-next").addEventListener("click",advance);
$("#interruption-next").addEventListener("click",advance);
document.addEventListener("keydown",event=>{
  if(!state||event.repeat||($("#dialogue-log")&&!$("#dialogue-log").hidden)) return;
  const picking=state.phase==="choices"||state.phase==="scene-choices";
  const history=$("#dialogue-history-button");
  if((event.code==="Space"||event.code==="Enter")&&!picking&&document.activeElement!==history){
    event.preventDefault();if(!$("#dialogue-next").disabled||!$("#dialogue-interruption").hidden)advance();
  }
  if(event.key==="Tab"){
    const advanceButton=$("#dialogue-interruption").hidden?$("#dialogue-next"):$("#interruption-next");
    const buttons=[...(picking?[...$("#dialogue-choices").querySelectorAll("button")]:advanceButton.disabled?[]:[advanceButton]),...(history?[history]:[])];
    const first=buttons[0],last=buttons.at(-1);
    if(!buttons.includes(document.activeElement)){event.preventDefault();first?.focus()}
    else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
  }
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
function scheduleSequence(){
  if(sequence&&!sequencePaused&&state.phase==="scene"&&lastMain().delay){
    remainingDelay=lastMain().delay;sequenceDeadline=Date.now()+remainingDelay;
    sequenceTimer=setTimeout(()=>{sequenceTimer=0;advance()},remainingDelay);
  }
}
function play({lines,choices:options=[],saved=null,progress=()=>{},complete=()=>{},choose=()=>{},line=()=>{}}){
  close();lastLoggedKey=null;sequence={lines,choices:options,choose};onProgress=progress;onComplete=complete;onLine=line;
  const picking=saved?.phase==="scene-choices"&&options.length;
  const index=Number.isInteger(saved?.index)&&saved.index>=0&&saved.index<lines.length?saved.index:0;
  state={phase:picking?"scene-choices":"scene",index};
  ui.hidden=false;onProgress(snapshot());render();scheduleSequence();
  if(!picking) $("#dialogue-next").focus({preventScroll:true});
}
function pause(){
  sequencePaused=true;
  if(sequenceTimer){remainingDelay=Math.max(0,sequenceDeadline-Date.now());clearTimeout(sequenceTimer);sequenceTimer=0}
}
function resume(){
  if(!sequencePaused)return;
  sequencePaused=false;
  if(sequence&&state?.phase==="scene"&&lastMain().delay){
    sequenceDeadline=Date.now()+remainingDelay;
    sequenceTimer=setTimeout(()=>{sequenceTimer=0;advance()},remainingDelay);
  }
}
window.PixelyDialogue={open,play,close,pause,resume,isOpen:()=>Boolean(state)};
})();
