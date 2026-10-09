const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../wardrobe-model.js');
function state(){return M.normalize({base:{scale:100},parts:[{id:'a',type:'clothes',subtype:'상의',name:'상의',x:20,y:-15,scale:110,rotate:12,visible:true},{id:'b',type:'face',name:'표정',visible:false}],selected:'a'});}

test('a saved appearance keeps its own image bytes and transform after editor replacements',async()=>{
  const current=state(),base=new Blob(['original body'],{type:'image/png'}),part=new Blob(['original outfit'],{type:'image/png'}),images=new Map([['base',base],['part-a',part]]);
  const snapshot=M.makeSnapshot(current,images,'산책','thumbnail',1000);
  current.parts[0].scale=220;current.parts[0].visible=false;images.set('base',new Blob(['replaced']));images.delete('part-a');
  assert.equal(snapshot.state.parts[0].scale,110);assert.equal(snapshot.state.parts[0].visible,true);
  assert.equal(await snapshot.images.find(([key])=>key==='base')[1].text(),'original body');
  assert.equal(await snapshot.images.find(([key])=>key==='part-a')[1].text(),'original outfit');
});

test('loading a slot restores saved layers but preserves newly registered parts, switched off',()=>{
  const original=state(),snapshot=M.makeSnapshot(original,new Map(),'저장한 모습','',1000);
  const current=state();current.parts.shift();current.parts.push({id:'new',type:'items',name:'새 소품',visible:true,scale:100});
  const restored=M.restoreSnapshot(current,snapshot);
  assert.deepEqual(restored.parts.map(part=>part.id),['a','b','new']);
  assert.equal(restored.parts[0].scale,110);assert.equal(restored.parts[0].visible,true);
  assert.equal(restored.parts[2].visible,false);assert.equal(current.parts[1].visible,true);
});

test('five independent slots preserve different appearances without shared mutable state',()=>{
  assert.equal(M.SLOT_COUNT,5);
  const current=state(),slots=[];
  for(let i=0;i<M.SLOT_COUNT;i++){current.parts[0].x=i*25;slots.push(M.makeSnapshot(current,new Map(),'모습 '+i,'',1000+i));}
  current.parts[0].x=400;
  assert.deepEqual(slots.map(slot=>slot.state.parts[0].x),[0,25,50,75,100]);
});

test('base remains underneath all parts while all four layer movements preserve relative order',()=>{
  const current=state();current.parts.push({id:'c',type:'decor',name:'장식',visible:true});
  assert.equal(M.move(current,'base','top'),false);
  M.move(current,'a','top');assert.deepEqual(current.parts.map(p=>p.id),['b','c','a']);
  M.move(current,'a','down');assert.deepEqual(current.parts.map(p=>p.id),['b','a','c']);
  M.move(current,'a','bottom');assert.deepEqual(current.parts.map(p=>p.id),['a','b','c']);
  M.move(current,'a','up');assert.deepEqual(current.parts.map(p=>p.id),['b','a','c']);
});

test('preview and PNG share exact fitted placement, scale, rotation and transparent canvas dimensions',()=>{
  assert.equal(M.WIDTH,1000);assert.equal(M.HEIGHT,1200);
  const fitted=M.imagePlacement({width:500,height:600},{x:40,y:-20,scale:50,rotate:90});
  assert.equal(fitted.x,540);assert.equal(fitted.y,580);
  assert.equal(fitted.width,400);assert.equal(fitted.height,480);assert.equal(fitted.rotation,Math.PI/2);
});

test('mirror fits every rotated corner, including large and displaced layers, below its arch',()=>{
  const placements=[
    M.imagePlacement({width:1800,height:500},{x:500,y:-600,scale:300,rotate:45}),
    M.imagePlacement({width:500,height:1800},{x:-500,y:600,scale:300,rotate:-70})
  ];
  for(const viewport of [{width:520,height:390},{width:300,height:500}]){
    const frame=M.previewFrame(placements,viewport);
    for(const p of placements)for(const dx of [-p.width/2,p.width/2])for(const dy of [-p.height/2,p.height/2]){
      const x=(p.x+dx*Math.cos(p.rotation)-dy*Math.sin(p.rotation))*frame.scale+frame.x;
      const y=(p.y+dx*Math.sin(p.rotation)+dy*Math.cos(p.rotation))*frame.scale+frame.y;
      assert.ok(x>=viewport.width*.1-1e-7&&x<=viewport.width*.9+1e-7);
      assert.ok(y>=viewport.height*.2-1e-7&&y<=viewport.height*.96+1e-7);
    }
  }
});

test('legacy wardrobe data migrates without losing names, visibility or positions; invalid values are bounded',()=>{
  const normalized=M.normalize({parts:[{id:'p1',type:'clothes',name:'내 옷',x:22,scale:145,visible:false},{id:'p1',type:'face'},{id:'bad',type:'invalid'}],base:{x:'broken',y:99999,scale:-5},selected:'missing'});
  assert.equal(normalized.parts.length,1);assert.equal(normalized.parts[0].x,22);assert.equal(normalized.parts[0].name,'내 옷');assert.equal(normalized.parts[0].visible,false);
  assert.equal(normalized.base.x,0);assert.equal(normalized.base.y,600);assert.equal(normalized.base.scale,20);assert.equal(normalized.selected,'base');
});
