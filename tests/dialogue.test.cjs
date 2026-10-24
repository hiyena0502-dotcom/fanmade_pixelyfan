'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),T=require('../dialogue-model.js'),M=require('../game-model.js'),D=require('../game-data.js'),P=require('../monologue-model.js');
test('member colours follow the requested mapping and remain globally editable',()=>{
 const d=M.content(D.defaults());for(const id of ['jam','gak','gong','rad','soo','duk','player'])assert.deepEqual(d.characters.find(c=>c.id===id).subtitleStyle,T.palettes[id]);
 d.characters.find(c=>c.id==='jam').subtitleStyle.accent='#123456';assert.equal(T.style(M.content(d).characters.find(c=>c.id==='jam').subtitleStyle,'jam').accent,'#123456');assert.equal(T.character(d,{speaker:'공룡'}).id,'gong');
});
test('ordinary lines have no captions; only a singular optional caption with simple animation is accepted',()=>{
 assert.equal(T.line({text:'사용자 대사'}).caption,undefined);assert.equal(T.caption({enabled:false}),null);
 for(const animation of ['none','fade','pop'])assert.equal(T.caption({text:'강조',animation}).animation,animation);
 for(const animation of ['shake','bounce','slide'])assert.throws(()=>T.caption({text:'강조',animation}));
 const d=D.defaults();d.events.sample=[{type:'say',actor:'jam',text:'긴 대사'.repeat(1500),caption:{text:'강조',actor:'gong'}}];assert.equal(M.content(d).events.sample[0].text,d.events.sample[0].text);d.events.sample[0].caption.actor='missing';assert.throws(()=>M.content(d));
});
test('long text pagination preserves newlines and surrogate pairs without changing content',()=>{
 const text=('긴 문장 🌿\n다음 줄\n').repeat(70),pages=T.paginate(text,80,3,ch=>ch==='🌿'?20:10);assert.ok(pages.length>20);assert.equal(pages.map(p=>text.slice(p.start,p.end)).join(''),text);for(let i=1;i<pages.length;i++)assert.equal(pages[i].start,pages[i-1].end);assert.throws(()=>T.line({text:'x'.repeat(8001)}));
});
test('one monologue scene contains continuous member lines and preserves its image layers',()=>{
 const d=M.content(D.defaults()),p=d.monologue.pages[0];p.lines.push({id:'second',actor:'gong',speaker:'공룡',delivery:'dialogue',text:'멤버 대사'},{id:'third',actor:'gak',speaker:'각별',delivery:'reaction',text:'리액션',caption:{text:'?',kind:'quiet',animation:'none'}});p.layers=[{id:'layer',name:'사용자 이미지',asset:'event:monologue:layer',animation:'none'}];const c=M.content(d);assert.equal(c.monologue.pages.length,1);assert.equal(c.monologue.pages[0].lines.length,3);assert.equal(c.monologue.pages[0].layers.length,1);assert.equal(P.content(undefined).pages[0].lines.length,1);
 const s=M.create(c,0);s.run={id:'preview',index:0,steps:[{type:'monologue',page:0}],presentation:{page:0,line:2,count:2,offset:1,effectElapsed:600}};assert.equal(M.restore(s,c).run.presentation.line,2);assert.equal(M.restore(s,c).run.presentation.offset,1);assert.throws(()=>M.content({...c,events:{...c.events,bad:[{type:'monologue',line:9}]}}));
});
test('bulk paste chooses registered speakers and joins continuation text in the same flow',()=>{
 const lines=T.parseSequence('꿈뜰이: 독백\n이어서 적은 긴 문장\n공룡: 멤버 대사\n각별：리액션',D.defaults().characters,{speaker:'꿈뜰이',actor:'player',delivery:'monologue'});assert.deepEqual(lines.map(l=>l.actor),['player','gong','gak']);assert.equal(lines[0].text,'독백\n이어서 적은 긴 문장');assert.equal(lines[0].delivery,'monologue');assert.equal(lines[1].delivery,'dialogue');
});
test('automatic captions avoid faces and dialogue while manual coordinates take precedence within bounds',()=>{
 const input={x:800,y:150,w:240,h:90,width:1600,height:900,bottom:650,faces:[{x:670,y:80,w:260,h:200}]};const auto=T.place(input);assert.ok(auto.y+90<=650);assert.ok(auto.x+240<=670||auto.x>=930||auto.y+90<=80||auto.y>=280);const manual=T.place({...input,manual:true});assert.equal(manual.x,680);assert.equal(manual.y,105);const edge=T.place({...input,x:1600,y:900,manual:true});assert.ok(edge.x+240<1600&&edge.y+90<650);
});
