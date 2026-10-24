'use strict';
(()=>{
const CONTENT_VERSION=2;
const DEMO_EVENTS=new Set(['invitation','invitation-again','bush','bush-again','knock','knock-again','talk-test','box','open-box','puzzle-start','puzzle-done','wrong-item']);
const DEMO_GOALS=new Set(['주변을 조사하고 현관문을 두드리기','현관에서 상자와 숫자 메모를 확인하기','테스트 완료 · 저장한 뒤 이어하기로 상태 확인']);
function defaults(){return outdoor({version:1,contentVersion:CONTENT_VERSION,start:'front',opening:'opening',autosave:{event:true,chapter:true,move:true,puzzle:true},locations:[
 {id:'front',name:'픽셀리의 집 · 집 앞',chapter:'prologue',background:'',builtin:'house',actors:[],objects:[],exits:[]}
],characters:[{id:'jam',name:'잠뜰',images:{}},{id:'gak',name:'각별',images:{}},{id:'rad',name:'라더',images:{}},{id:'soo',name:'수현',images:{}},{id:'gong',name:'공룡',images:{}},{id:'duk',name:'덕개',images:{}},{id:'player',name:'꿈뜰이',images:{}}],items:[],puzzles:[],inspections:[],events:{opening:[]}});}
const ARRIVAL_LINES=[{type:'say',actor:'player',speaker:'꿈뜰이',text:'여기구나!'},{type:'say',actor:'player',speaker:'꿈뜰이',text:'생각보다 조용하네...\n다들 안에 계시려나?'}];
function outdoor(next){
 if(next.outdoorVersion>=1)return next;
 const front=next.locations?.find(scene=>scene.id==='front');
 if(!front||next.start!=='front')return next;
 front.time='6월 1일 · 낮';front.ambience='garden';
 front.objects=front.objects||[];front.objects=front.objects.filter(object=>object.id!=='front-door');
 front.objects.push({id:'front-door',name:'현관문 앞으로',kind:'move',to:'porch',rect:{x:48,y:60,w:4,h:13},condition:[]});
 if(!next.locations.some(scene=>scene.id==='porch'))next.locations.push({id:'porch',name:'픽셀리의 집 · 현관문 앞',time:'6월 1일 · 낮',ambience:'garden',chapter:'prologue',background:'',builtin:'porch',actors:[],objects:[],exits:[{id:'porch-back',to:'front',label:'집 앞으로 돌아가기',side:'bottom',condition:[]}]});
 next.events||={};next.events[next.opening||'opening']=structuredClone(ARRIVAL_LINES);next.outdoorVersion=1;return next;
}
function stepsWithoutDemo(steps){return (steps||[]).flatMap(step=>{
 if(['give','take','puzzle','complete','object','closeup','closeup-back'].includes(step.type))return [];
 if(step.type==='say'&&(step.speaker?.includes('테스트')||step.text?.startsWith('[테스트]')))return [];
 if(step.type==='goal'&&DEMO_GOALS.has(step.text))return [];
 const next=structuredClone(step);
 if(next.type==='choice')next.options=next.options.map(option=>({...option,steps:stepsWithoutDemo(option.steps)}));
 return [next];
});}
// Retire the old prototype once. Newly authored content starts at version 2.
function migrate(value){const next=structuredClone(value||defaults());if(Number(next.contentVersion)>=CONTENT_VERSION)return outdoor(next);
 const events=new Set(DEMO_EVENTS);
 for(const scene of [...(next.locations||[]),...(next.inspections||[])]){
  if(scene.enter&&DEMO_EVENTS.has(scene.enter))delete scene.enter;
  for(const object of scene.objects||[]){if(object.event)events.add(object.event);for(const event of object.repeat||[])events.add(event);for(const variant of object.variants||[])if(variant.event)events.add(variant.event);for(const use of Object.values(object.use||{}))if(use.event)events.add(use.event);}
  scene.objects=[];scene.exits=[];
 }
 for(const character of next.characters||[])if(character.talk){events.add(character.talk);delete character.talk;}
 for(const puzzle of next.puzzles||[])if(puzzle.success)events.add(puzzle.success);
 next.items=[];next.puzzles=[];next.inspections=[];
 for(const event of events){if(event===next.opening)continue;delete next.events?.[event];delete next.eventLayers?.[event];delete next.eventNames?.[event];}
 for(const [event,steps]of Object.entries(next.events||{}))next.events[event]=stepsWithoutDemo(steps);
 next.contentVersion=CONTENT_VERSION;return outdoor(next);
}
function restore(raw,data){const next=structuredClone(raw);if(!next||typeof next!=='object')return next;const legacy=Number(next.contentVersion||0)<CONTENT_VERSION&&data.contentVersion===CONTENT_VERSION;
 if(!next.outdoorVersion&&data.outdoorVersion){
  if(next.run?.id==='prologue-opening'&&Array.isArray(next.run.steps)){
   const old=next.run.steps,firstSay=old.findIndex(step=>step.type==='say');
   if(firstSay>=0){next.run.steps=[...old.slice(0,firstSay),...structuredClone(ARRIVAL_LINES)];if(next.run.index>=firstSay){next.run.index=firstSay;delete next.run.presentation;}}
   else next.run.steps.push(...structuredClone(ARRIVAL_LINES));
  }
  next.outdoorVersion=data.outdoorVersion;
 }
 if(!legacy)return next;
 const registered=new Set(data.items.map(item=>item.id));next.inventory=Object.fromEntries(Object.entries(next.inventory||{}).filter(([id])=>registered.has(id)));
 if(!registered.has(next.selectedItem))next.selectedItem=null;
 next.inspectionStack=[];next.inspectionContexts=[];
 if(DEMO_GOALS.has(next.goal))next.goal='';next.completedGoals=(next.completedGoals||[]).filter(goal=>!DEMO_GOALS.has(goal));
 const oldScene=data.locations.find(scene=>scene.id===next.location);
 if(next.location==='hall'&&(!oldScene||oldScene.builtin==='blank'&&oldScene.name?.includes('테스트')&&!oldScene.background&&!oldScene.layers?.length))next.location=data.start;
 if(next.run&&DEMO_EVENTS.has(next.run.id)&&!data.events[next.run.id]){next.run=null;next.eventImage='';next.dim=0;}
 else if(next.run&&Array.isArray(next.run.steps)&&Number.isInteger(next.run.index)&&next.run.index>=0&&next.run.index<=next.run.steps.length){const keptBefore=stepsWithoutDemo(next.run.steps.slice(0,next.run.index)).length,oldStep=next.run.steps[next.run.index];next.run.steps=stepsWithoutDemo(next.run.steps);next.run.index=keptBefore;if(next.run.index>=next.run.steps.length)next.run=null;else if(oldStep!==undefined&&stepsWithoutDemo([oldStep]).length===0)delete next.run.presentation;else if(next.run.presentation)next.run.presentation.index=keptBefore;}
 next.contentVersion=CONTENT_VERSION;return next;
}
const api={defaults,migrate,restore,CONTENT_VERSION};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.PixelyGameData=api;
})();
