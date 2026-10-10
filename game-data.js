'use strict';
(()=>{
const test=text=>'[테스트] '+text;
function defaults(){return {version:1,start:'front',opening:'opening',autosave:{event:true,chapter:true,move:true,puzzle:true},locations:[
 {id:'front',name:'픽셀리의 집 · 집 앞',chapter:'prologue',background:'',builtin:'house',actors:[],objects:[
 {id:'invitation',name:'초대장',kind:'inspect',placeholder:true,rect:{x:14,y:62,w:13,h:17},event:'invitation',repeat:['invitation-again'],condition:[]},
 {id:'bush',name:'집 앞 덤불',kind:'inspect',rect:{x:58,y:79,w:17,h:18},event:'bush',repeat:['bush-again'],condition:[]},
 {id:'door',name:'현관문',kind:'use',rect:{x:43,y:66,w:10,h:27},event:'knock',repeat:['knock-again'],condition:[]}],exits:[{id:'to-hall',to:'hall',label:'현관으로',side:'right',condition:[{type:'flag',id:'door-open',value:true}]}]},
 {id:'hall',name:'픽셀리의 집 · 현관 (테스트)',chapter:'prologue',background:'',builtin:'blank',actors:[{id:'jam',x:55,y:65,scale:70,rotate:0,flip:false,z:10,visible:true,emotion:'normal',condition:[]}],objects:[{id:'box',name:'연습용 상자',kind:'use',rect:{x:23,y:44,w:18,h:22},event:'box',use:{'test-key':{event:'open-box',consume:true}},condition:[]},{id:'puzzle',name:'숫자 메모',kind:'use',rect:{x:70,y:35,w:16,h:17},event:'puzzle-start',condition:[]}],exits:[{id:'to-front',to:'front',label:'집 앞으로',side:'left',condition:[]}]}
],characters:[{id:'jam',name:'잠뜰',images:{},talk:'talk-test',condition:[]},{id:'gak',name:'각별',images:{}},{id:'rad',name:'라더',images:{}},{id:'soo',name:'수현',images:{}},{id:'gong',name:'공룡',images:{}},{id:'duk',name:'덕개',images:{}},{id:'player',name:'꿈뜰이',images:{}}],items:[{id:'invite',name:'초대장',description:'테스트 장면에서 확인한 초대장',image:'',collection:'item-1'},{id:'test-key',name:'연습용 열쇠',description:'현관의 연습용 상자에 사용하는 테스트 아이템',image:'',collection:'item-2'},{id:'flower',name:'꽃 배지',description:'상자를 열어 획득하는 테스트 아이템',image:'',collection:'item-3'}],puzzles:[{id:'number-note',title:'숫자 메모 · 테스트',question:'테스트 번호 13을 입력해 주세요',answer:'13',success:'puzzle-done'}],events:{
 opening:[{type:'say',speaker:'꿈뜰이',text:'초대는 받았고, 귀가는 미정!'},{type:'say',speaker:'시스템 · 테스트',text:test('프롤로그 시스템 확인 장면이야 · 정식 대사와 일러스트는 나중에 연결해')},{type:'goal',text:'주변을 조사하고 현관문을 두드리기'}],
 invitation:[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('초대장을 확인했어')},{type:'give',id:'invite'},{type:'collect',id:'item-1'}],
 'invitation-again':[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('이미 확인한 초대장이야')}],
 bush:[{type:'sfx',id:'bush'},{type:'say',speaker:'꿈뜰이 · 테스트',text:test('덤불에서 연습용 열쇠를 발견했어')},{type:'give',id:'test-key'},{type:'collect',id:'item-2'}],
 'bush-again':[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('이번에는 바스락거리는 소리만 들려')}],
 knock:[{type:'sfx',id:'house'},{type:'shake',strength:3},{type:'say',speaker:'꿈뜰이 · 테스트',text:test('똑똑 · 노크 이벤트 확인')},{type:'say',speaker:'잠뜰 · 테스트',actor:'jam',emotion:'normal',text:test('멤버 대화 연결을 확인하는 임시 대사야')},{type:'choice',id:'door-choice',options:[{text:'들어가기',steps:[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('현관 이동이 열렸어')},{type:'flag',id:'door-open',value:true},{type:'collect',id:'person-1'},{type:'goal',text:'현관에서 상자와 숫자 메모를 확인하기'}]},{text:'주변을 더 살펴보기',steps:[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('집 앞 탐색을 이어 가자')}]}]}],
 'knock-again':[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('현관문을 다시 확인했어')},{type:'flag',id:'door-open',value:true}],
 'talk-test':[{type:'say',speaker:'잠뜰 · 테스트',actor:'jam',emotion:'normal',text:test('캐릭터 클릭과 이름표 연결 확인')}],
 box:[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('연습용 열쇠를 가방에서 골라 상자에 사용해 보자')}],
 'open-box':[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('상자를 열었어 · 열쇠는 소모되고 꽃 배지를 얻었어')},{type:'give',id:'flower'},{type:'collect',id:'item-3'},{type:'flag',id:'box-open',value:true}],
 'puzzle-start':[{type:'puzzle',id:'number-note'}],
 'puzzle-done':[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('퍼즐 완료와 저장 복원까지 확인했어')},{type:'complete',id:'number-note'},{type:'goal',text:'테스트 완료 · 저장한 뒤 이어하기로 상태 확인'}],
 'wrong-item':[{type:'say',speaker:'꿈뜰이 · 테스트',text:test('이곳에는 사용할 수 없는 조합이야')}]
}};}
const api={defaults};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.PixelyGameData=api;
})();
