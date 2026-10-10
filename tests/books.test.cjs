const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../book-data.js'),M=require('../book-model.js');

test('initial records are drafts; only the prologue is unlocked and no collection is collected',()=>{
  const cat=D.catalogue(),progress=D.progress();assert.equal(cat.chapters.length,4);assert.equal(M.chapterState(cat.chapters[0],progress),'available');
  for(const entry of cat.chapters.slice(1))assert.equal(M.chapterState(entry,progress),'locked');
  assert.equal(cat.collections.people.length,6);assert.equal(Object.values(cat.collections).flat().filter(e=>progress.collections[e.id]).length,0);
  assert.equal(cat.collections.cards.length,0);assert.equal(cat.collections.memories.length,0);
});
test('locked chapter and collection views do not expose names, descriptions or related content',()=>{
  const entry={id:'secret',number:3,title:'비밀 이름',description:'비밀 대사',intro:'비밀 메모',chapter:'비밀 장소',location:'비밀 위치',related:'비밀 인물',decoration:'letter'};
  for(const group of ['chapters','people','cards','items','memories']){
    const view=M.display(entry,group,D.progress());assert.equal(view.status,'locked');assert.ok(!JSON.stringify(view).includes('비밀'));assert.equal(view.decoration,'none');
  }
});
test('cleared chapters unlock and individual registrations preserve all other progress',()=>{
  const original=D.progress(),next=M.updateProgress(original,{chapters:{'chapter-001':{cleared:true}},collections:{'person-2':true}});
  assert.deepEqual(next.chapters['chapter-001'],{unlocked:true,cleared:true});assert.equal(next.chapters.prologue.unlocked,true);assert.equal(next.collections['person-2'],true);assert.equal(original.collections['person-2'],undefined);
  const relocked=M.updateProgress(next,{chapters:{'chapter-001':{unlocked:false,cleared:false}},collections:{'person-2':false}});assert.equal(relocked.chapters['chapter-001'].unlocked,false);assert.equal(relocked.collections['person-2'],false);
});
test('pagination shows four chapters or six collectibles and clamps removed or invalid pages',()=>{
  const entries=Array.from({length:13},(_,i)=>({id:'p'+i}));
  assert.equal(M.paginate(entries,0,4).total,4);assert.deepEqual(M.paginate(entries,3,4).entries,[entries[12]]);
  assert.equal(M.paginate(entries,0,6).total,3);assert.deepEqual(M.paginate(entries,2,6).entries,[entries[12]]);
  assert.equal(M.paginate(entries,999,4).page,3);assert.equal(M.paginate([],9,6).total,1);assert.equal(M.paginate([],9,6).page,0);
});
test('saved category, pages and selections normalize against current catalogue after edits',()=>{
  const cat=D.catalogue(),view=M.view({category:'items',chapterPage:20,chapterSelected:'gone',pages:{people:20},selections:{people:'person-3',items:'gone'}},cat);
  assert.equal(view.category,'items');assert.equal(view.chapterPage,0);assert.equal(view.pages.people,0);assert.equal(view.selections.people,'person-3');assert.equal(view.selections.items,'item-1');
  assert.equal(M.view({category:'invalid'},cat).category,'people');
});
test('image transforms are bounded independently from page layout and image roles remain separate',()=>{
  assert.deepEqual(M.imageTransform({x:80,y:-80,scale:700,rotate:999}),{x:50,y:-50,scale:400,rotate:180});
  assert.deepEqual(M.imageTransform({x:'bad',scale:'bad'}),{x:0,y:0,scale:100,rotate:0});
  assert.equal(M.imageKey('prologue'),'prologue:main');assert.equal(M.imageKey('prologue','decoration'),'prologue:decoration');
});
test('catalogue edits reject duplicate and unsafe IDs and keep text as plain data',()=>{
  const cat=D.catalogue();cat.chapters.push({...cat.chapters[0]},{id:'__proto__',title:'bad'});cat.collections.people[0].description='<img src=x onerror=alert(1)>';
  const next=M.catalogue(cat);assert.equal(next.chapters.length,4);assert.equal(next.collections.people[0].description,'<img src=x onerror=alert(1)>');
  const progress=M.progress(JSON.parse('{"chapters":{"__proto__":{"cleared":true}},"collections":{"constructor":true}}'));assert.equal(Object.keys(progress.chapters).length,0);assert.equal(Object.keys(progress.collections).length,0);
});
