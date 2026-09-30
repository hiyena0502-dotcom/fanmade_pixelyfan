const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const directory=path.join(__dirname,"..");
const gameConfig=fs.readFileSync(path.join(directory,"data/game-config.js"),"utf8");
const editorSchema=fs.readFileSync(path.join(directory,"data/editor-schema.js"),"utf8");
const app=fs.readFileSync(path.join(directory,"app.js"),"utf8");
const styleFiles=["style.css","styles/core.css","styles/home.css","styles/chapters.css","styles/collection.css","styles/story.css","styles/wardrobe.css","styles/editor.css"];
const allCss=styleFiles.map(file=>fs.readFileSync(path.join(directory,file),"utf8")).join("\n");
const storageKey="pixely-lost-sky-saves-v2";
const wardrobeKey="pixely-lost-sky-wardrobe-assets-v1";
const devContentKey="pixely-lost-sky-dev-content-v2";

function boot(saved,initialVersion=JSON.parse(fs.readFileSync(path.join(directory,"site-version.json"),"utf8")).version,wardrobeAssets){
  const nodes=new Map();
  const listeners={};
  const requests=[];
  let publishedVersion=initialVersion;
  let confirmResult=true;
  let failStorage=false;
  let interval;
  let elementCount=0;
  function node(key){
    if(!nodes.has(key)){
      const classes=new Set();
      nodes.set(key,{
        hidden:true,style:{},dataset:{},innerHTML:"",textContent:"",children:[],
        listeners:{},
        classList:{toggle(name,on){if(on) classes.add(name);else classes.delete(name)},add(name){classes.add(name)},remove(name){classes.delete(name)},contains(name){return classes.has(name)}},
        setAttribute(name,value){this[name]=value},
        addEventListener(name,callback){this.listeners[name]=callback},
        querySelector(selector){return node(selector)},
        querySelectorAll(){return []},
        getBoundingClientRect(){return {left:0,top:0,width:1000,height:600,right:1000,bottom:600}},
        replaceChildren(...children){this.children=children},
        append(child){this.children.push(child)}
      });
    }
    return nodes.get(key);
  }
  const tabs=["cards","items","postcards"].map(key=>{
    const result=node(`tab:${key}`);
    result.dataset.collectionTab=key;
    return result;
  });
  const wardrobeTabs=["outfit","accessory","face","decoration"].map(key=>{
    const result=node(`wardrobe-tab:${key}`);
    result.dataset.wardrobeSlot=key;
    return result;
  });
  const devCollectionTabs=["cards","items","postcards"].map(key=>{
    const result=node(`dev-collection:${key}`);
    result.dataset.devCollectionType=key;
    return result;
  });
  const views=["home","chapters","collection","wardrobe","dev","story"].map(key=>{
    const result=node(`view:${key}`);
    result.dataset.view=key;
    return result;
  });
  const document={
    readyState:"complete",baseURI:"https://example.com/fanmade_pixely/",visibilityState:"visible",
    createElement(tag){return node(`element:${tag}:${++elementCount}`)},
    getElementById(id){return node(`#${id}`)},
    querySelector(selector){
      const view=selector.match(/^\[data-view=['"]([^'"]+)['"]\]$/);
      return view?views.find(entry=>entry.dataset.view===view[1]):node(selector);
    },
    querySelectorAll(selector){
      if(selector==="[data-view]") return views;
      if(selector===".diary-tabs button") return tabs;
      if(selector==="[data-wardrobe-slot]") return wardrobeTabs;
      if(selector==="[data-dev-collection-type]") return devCollectionTabs;
      if(["[data-open-collection]","[data-open-chapters]","[data-open-wardrobe]","[data-open-dev]","[data-go-home]","[data-close-modal]"].includes(selector)) return [node(selector)];
      if(["[data-story-hotspot]","[data-story-exit]","[data-story-drawer]","[data-story-close-panel]","[data-layer-move]","[data-wardrobe-transform]"].includes(selector)) return [];
      return [];
    },
    addEventListener(name,callback){listeners[name]=callback}
  };
  const storage=new Map();
  if(saved!==undefined) storage.set(storageKey,JSON.stringify(saved));
  if(wardrobeAssets!==undefined) storage.set(wardrobeKey,JSON.stringify(wardrobeAssets));
  const context={
    document,URL,console,
    window:{confirm(){return confirmResult},scrollTo(){},setTimeout(){return 1},location:{reload(){}},addEventListener(name,callback){listeners[name]=callback}},
    localStorage:{getItem(key){return storage.get(key)||null},setItem(key,value){if(failStorage) throw new Error("quota");storage.set(key,value)}},
    fetch(url,options){
      requests.push({url:String(url),options});
      return Promise.resolve({ok:true,json:async()=>({version:publishedVersion})});
    },
    setInterval(callback){interval=callback},setTimeout(){return 1},clearTimeout(){}
  };
  vm.runInNewContext(gameConfig,context);
  vm.runInNewContext(editorSchema,context);
  vm.runInNewContext(app,context);
  return {
    node,storage,requests,context,tick:()=>interval(),
    setVersion(value){publishedVersion=value},
    setConfirm(value){confirmResult=value},
    setStorageFailure(value){failStorage=value},
    click(selector){node(selector).listeners.click()},
    slotAction(attribute,index){
      node("#save-slot-list").listeners.click({target:{closest(selector){
        return selector===`[data-${attribute}]` ? {dataset:{[attribute.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())]:String(index)}} : null;
      }}});
    }
  };
}

test("saved slots are normalized and escaped before being inserted as HTML",()=>{
  const state=boot({activeSlot:9,slots:[{chapter:"<img src=x>",location:"<script>x</script>",progress:900,playSeconds:-1,collection:{cards:["dreamer"]}},null,null]});
  assert.equal(state.node("#current-slot-label").textContent,"NO DATA");
  state.click("#save-manager-button");
  const markup=state.node("#save-slot-list").innerHTML;
  assert.match(markup,/&lt;img src=x&gt;/);
  assert.match(markup,/&lt;script&gt;x&lt;\/script&gt;/);
  assert.match(markup,/100%/);
  assert.doesNotMatch(markup,/<script>/);
});

test("saving over a different occupied slot requires confirmation",()=>{
  const save=chapter=>({chapter,location:"파티",savedAt:1,collection:{cards:["dreamer"]}});
  const state=boot({activeSlot:0,slots:[save("첫 번째"),save("두 번째"),null]});
  state.click("#quick-save-button");
  state.setConfirm(false);
  state.slotAction("save-slot",1);
  assert.equal(JSON.parse(state.storage.get(storageKey)).slots[1].chapter,"두 번째");
  state.setConfirm(true);
  state.slotAction("save-slot",1);
  assert.equal(JSON.parse(state.storage.get(storageKey)).slots[1].chapter,"첫 번째");
});

test("new game opens the Chapter 1 party room with its first objective",()=>{
  const state=boot();
  state.click("#new-game-button");
  state.slotAction("new-slot",2);
  const saved=JSON.parse(state.storage.get(storageKey));
  assert.equal(saved.activeSlot,2);
  assert.deepEqual(saved.slots[2].collection.cards,["dreamer"]);
  assert.equal(saved.slots[2].missions[0].id,"explore-party-room");
  assert.equal(saved.slots[2].story.scene,"party-room");
  assert.equal(state.node("view:story").hidden,false);
  assert.equal(state.node("#story-current-objective").textContent,"파티방을 둘러보자");
  assert.equal(saved.slots[2].completedChapters.length,0);
});

test("Chapter 1 starts at the wide house and waits for a door click before the close-up",()=>{
  const state=boot();
  state.click("#new-game-button");
  state.slotAction("new-slot",0);
  for(let index=0;index<5;index++) state.click("#story-intro-next");
  assert.equal(state.node("#story-intro-kicker").textContent,"꿈뜰이");
  assert.equal(state.node("#story-intro").classList.contains("is-exterior"),true);
  state.click("#story-intro-next");
  state.click("#story-intro-next");
  assert.equal(state.node("#story-intro-house").hidden,false);
  assert.equal(state.node("#story-intro-next").disabled,true);
  state.click("#story-intro-house");
  assert.equal(state.node("#story-intro").classList.contains("is-approaching"),true);
  const css=allCss;
  assert.match(css,/is-exterior \.story-intro-backdrop\{\s*background-image:url\("\.\.\/assets\/story\/chapter1\/house-wide\.webp/);
  assert.match(css,/is-door \.story-intro-backdrop\{\s*background-image:url\("\.\.\/assets\/story\/chapter1\/house-door-close\.webp/);
  assert.match(css,/is-chapter \.story-intro-backdrop\{opacity:0/);
  assert.match(css,/is-chapter \.intro-house\{display:none !important\}/);
  assert.match(css,/\.story-stage:has\(\.story-intro-overlay:not\(\[hidden\]\)\) \.story-hud/);
  for(const name of ["house-door-close.webp","house-wide.webp"]){
    assert.ok(fs.statSync(path.join(directory,"assets/story/chapter1",name)).size>100000);
  }
});

test("existing saves normalize into the current party-room interface",()=>{
  const saved={activeSlot:0,slots:[{
    chapter:"챕터 1 완료",location:"파티",savedAt:1,progress:15,
    story:{phase:"done",found:["ribbon"],delivered:["ribbon"]},
    completedChapters:["night"],collection:{cards:[],items:[],postcards:[]}
  },null,null]};
  const state=boot(saved);
  state.click("#continue-button");
  assert.equal(state.node("view:story").hidden,false);
  assert.match(state.node("#story-inventory-list").innerHTML,/가방이 비어 있어요/);
  const normalized=JSON.parse(state.storage.get(storageKey)).slots[0];
  assert.equal(normalized.story.scene,"party-room");
  assert.deepEqual(normalized.story.inspected,[]);
});

test("collection tabs switch without losing the selected state",()=>{
  const state=boot();
  state.click("[data-open-collection]");
  const button=state.node("tab:postcards");
  state.node(".diary-tabs").listeners.click({target:{closest(){return button}}});
  assert.equal(button["aria-selected"],"true");
  assert.equal(state.node("tab:cards")["aria-selected"],"false");
  assert.equal(state.node("#collection-total").textContent,0);
  assert.match(state.node("#collection-grid").className,/postcards/);
});

test("collection starts with zero cards items and postcards",()=>{
  const state=boot();
  state.click("[data-open-collection]");
  assert.equal(state.node("#collection-total").textContent,0);
  assert.match(state.node("#collection-grid").innerHTML,/아직 이 페이지는 비어 있어요/);
  for(const key of ["items","postcards"]){
    const button=state.node("tab:"+key);
    state.node(".diary-tabs").listeners.click({target:{closest(){return button}}});
    assert.equal(state.node("#collection-total").textContent,0);
    assert.match(state.node("#collection-grid").innerHTML,/아직 이 페이지는 비어 있어요/);
  }
});

test("empty default item catalogue does not invent removed wardrobe items",()=>{
  const state=boot();
  state.click("#new-game-button");
  state.slotAction("new-slot",0);
  state.click("[data-open-wardrobe]");
  assert.deepEqual(Array.from(state.context.window.PixelyAvatar.outfitForActiveSave().layers),[]);
  assert.equal(state.context.window.PixelyInventory.grantItem("plush"),false);
  assert.doesNotMatch(state.node("#wardrobe-options").innerHTML,/치명적으로 귀여운 봉제인형/);
});

test("legacy equipment ids are rejected when the default collection is empty",()=>{
  const state=boot({activeSlot:0,slots:[{collection:{cards:[],items:[]},outfit:{accessory:"plush"}},null,null]});
  assert.deepEqual(Array.from(state.context.window.PixelyAvatar.outfitForActiveSave().layers),[]);
  assert.equal(state.context.window.PixelyInventory.grantItem("plush"),false);
});

test("a local storage failure keeps the new save playable in the current tab",()=>{
  const state=boot();
  state.setStorageFailure(true);
  state.click("#new-game-button");
  state.slotAction("new-slot",0);
  assert.equal(state.storage.has(storageKey),false);
  assert.match(state.node("#current-slot-label").textContent,/SLOT 1/);
  assert.match(state.node("#toast").textContent,/현재 탭에서만 진행/);
});

test("update prompt compares the loaded version on the first check and on later checks",async()=>{
  const state=boot();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.node("#update-modal").hidden,true);
  assert.equal(state.requests[0].options.cache,"no-store");
  state.setVersion("54");
  state.tick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.node("#update-modal").hidden,false);
  state.click("#update-later-button");
  assert.equal(state.node("#update-modal").hidden,true);
  state.tick();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(state.node("#update-modal").hidden,true);
  const stale=boot(undefined,"40");
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(stale.node("#update-modal").hidden,false);
});

test("deployed version and asset cache keys match the script",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  const version=JSON.parse(fs.readFileSync(path.join(directory,"site-version.json"),"utf8")).version;
  assert.match(app,new RegExp(`SITE_VERSION = "${version}"`));
  assert.match(html,new RegExp(`style\\.css\\?v=${version}`));
  assert.match(html,new RegExp(`data/game-config\\.js\\?v=${version}`));
  assert.match(html,new RegExp(`data/editor-schema\\.js\\?v=${version}`));
  assert.match(html,new RegExp(`app\\.js\\?v=${version}`));
});


test("wardrobe image editor controls and multi-layer upload UI are present",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  assert.match(html,/id="wardrobe-base-file"/);
  assert.match(html,/id="wardrobe-image-file"/);
  assert.match(html,/id="wardrobe-upload-slot"/);
  assert.match(html,/id="wardrobe-part-group"/);
  assert.match(html,/id="wardrobe-layer-select"/);
  assert.match(html,/data-layer-move="down"/);
  assert.match(html,/data-layer-move="up"/);
  assert.match(html,/data-wardrobe-transform="x"/);
  assert.match(html,/data-wardrobe-transform="y"/);
  assert.match(html,/data-wardrobe-transform="scale"/);
  assert.match(html,/data-wardrobe-transform="rotation"/);
  assert.match(app,/WARDROBE_ASSET_KEY/);
  assert.match(app,/wardrobeAssets\.custom/);
});


test("developer wardrobe setup toggles multiple custom parts without a save slot",()=>{
  const assets={
    base:{image:"data:image/png;base64,BASE",name:"베이스",transform:{x:0,y:0,scale:100,rotation:0}},
    custom:[
      {id:"custom-eyes",slot:"face",group:"eyes",name:"기본 눈",image:"data:image/png;base64,EYES",custom:true,transform:{x:0,y:0,scale:100,rotation:0}},
      {id:"custom-mouth",slot:"face",group:"mouth",name:"기본 입",image:"data:image/png;base64,MOUTH",custom:true,transform:{x:0,y:0,scale:100,rotation:0}}
    ],
    layerOrder:["custom-eyes","custom-mouth"],
    setupOutfit:{layers:[]}
  };
  const state=boot(undefined,"30",assets);
  state.click("[data-open-wardrobe]");
  assert.equal(state.node("#wardrobe-slot-label").textContent,"DEV SETUP");
  const faceTab=state.node("wardrobe-tab:face");
  state.node("#wardrobe-tabs").listeners.click({target:{closest(){return faceTab}}});
  const click=id=>state.node("#wardrobe-options").listeners.click({target:{closest(selector){return selector==="[data-wardrobe-item]"?{dataset:{wardrobeItem:id},disabled:false}:null}}});
  click("custom-eyes");
  click("custom-mouth");
  const stored=JSON.parse(state.storage.get(wardrobeKey));
  assert.deepEqual(stored.setupOutfit.layers,["custom-eyes","custom-mouth"]);
  assert.match(state.node("#wardrobe-preview").innerHTML,/data:image\/png;base64,EYES/);
  assert.match(state.node("#wardrobe-preview").innerHTML,/data:image\/png;base64,MOUTH/);
});


test("simplified wardrobe editor keeps all four multi-select categories",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  for(const slot of ["outfit","accessory","face","decoration"]){
    assert.match(html,new RegExp('data-wardrobe-slot="'+slot+'"'));
  }
  assert.match(app,/모든 분류에서 여러 파츠를 동시에 선택할 수 있어요/);
  assert.match(html,/id="wardrobe-add-part-button"/);
  assert.match(html,/등록하고 켜기/);
});


test("developer editor is collection-only",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  assert.match(html,/data-open-dev/);
  assert.match(html,/data-view="dev"/);
  assert.match(html,/id="dev-collection-types"/);
  assert.match(html,/data-dev-collection-type="cards"/);
  assert.match(html,/data-dev-collection-type="items"/);
  assert.match(html,/data-dev-collection-type="postcards"/);
  for(const removed of ["chapters","items","wardrobe","data"]){
    assert.doesNotMatch(html,new RegExp('data-dev-section="'+removed+'"'));
  }
  assert.doesNotMatch(html,/id="dev-open-chapter-scene"/);
  assert.doesNotMatch(html,/id="dev-wardrobe-mount"/);
  assert.doesNotMatch(html,/id="dev-data-tools"/);
  assert.doesNotMatch(html,/id="story-dev-enter"/);
  assert.doesNotMatch(html,/id="story-dev-toolbar"/);
  assert.doesNotMatch(app,/interactionSchema/);
});

test("collection editor can create and save a card",()=>{
  const state=boot(undefined,"54");
  state.click("[data-open-dev]");
  state.click("#dev-new-entry");
  assert.equal(state.storage.get(devContentKey),undefined);
  assert.equal(state.node("#dev-global-status").textContent,"저장 필요");
  state.click("#dev-save-all");
  const stored=JSON.parse(state.storage.get(devContentKey));
  assert.equal(Array.isArray(stored.cards),true);
  assert.equal(stored.cards.some(item=>item.name==="새 카드"),true);
  assert.deepEqual(Object.keys(stored).sort(),["cards","items","postcards"]);
});

test("collection editor switches between cards and postcards and supports undo",()=>{
  const state=boot();
  state.click("[data-open-dev]");
  state.click("#dev-new-entry");
  state.click("#dev-undo");
  assert.equal(state.storage.get(devContentKey),undefined);
  const postTab=state.node("dev-collection:postcards");
  state.node("#dev-collection-types").listeners.click({target:{closest(){return postTab}}});
  state.click("#dev-new-entry");
  assert.match(state.node("#dev-editor-title").textContent,/새 엽서/);
});

test("desktop chapters and collection use wide-screen layout rules",()=>{
  const css=allCss;
  assert.match(css,/@media\(min-width:1100px\)/);
  assert.match(css,/\.chapters-shell\{[\s\S]*grid-template-columns:minmax\(260px,330px\) minmax\(0,1fr\)/);
  assert.match(css,/\.diary-wrap\{[\s\S]*width:min\(1500px,calc\(100vw - 80px\)\)/);
  assert.match(css,/\.collection-grid\{[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});


test("desktop wardrobe uses a wide balanced workspace",()=>{
  const css=allCss;
  assert.match(css,/DESKTOP WARDROBE WORKSPACE v29/);
  assert.match(css,/width:min\(1520px,calc\(100vw - 64px\)\)/);
  assert.match(css,/grid-template-columns:minmax\(440px,520px\) minmax\(0,1fr\)/);
  assert.match(css,/\.wardrobe-dev-panel\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);
  assert.match(css,/height:auto !important;[\s\S]*min-height:640px !important/);
});


test("wardrobe transform controls support direct numeric input",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  for(const key of ["x","y","scale","rotation"]){
    assert.match(html,new RegExp('data-wardrobe-transform-number="'+key+'"'));
  }
  assert.match(app,/data-wardrobe-transform-number/);
  assert.match(app,/wardrobeTransformNumber/);
});


test("static game and editor configuration are split from the runtime",()=>{
  assert.match(gameConfig,/window\.PixelyGameConfig/);
  assert.match(editorSchema,/window\.PixelyEditorSchema/);
  assert.doesNotMatch(app,/const catalogue = \{/);
  assert.doesNotMatch(app,/const devSchemas=\{/);
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  assert.match(html,/data\/game-config\.js\?v=54/);
  assert.match(html,/data\/editor-schema\.js\?v=54/);
});


test("feature CSS is split into maintainable modules without legacy patch stacks",()=>{
  const entry=fs.readFileSync(path.join(directory,"style.css"),"utf8");
  for(const file of ["core","home","chapters","collection","story","wardrobe","editor"]){
    assert.match(entry,new RegExp('styles/'+file+'\\.css\\?v=54'));
    assert.ok(fs.statSync(path.join(directory,"styles",file+".css")).size>100);
  }
  assert.doesNotMatch(allCss,/VISUAL PATCH v|WARDROBE PATCH v|WARDROBE IMAGE EDITOR v|WARDROBE PREVIEW \+ DEV EDITOR v|WARDROBE ALL-MULTI|SIMPLE WARDROBE DEV EDITOR|CHAPTER INTERACTION EDITOR v|DESKTOP WARDROBE WORKSPACE v|WARDROBE RE-EDIT v|WARDROBE TRANSFORM NUMBER INPUTS v/);
});


test("collection editor starts with zero default items",()=>{
  const state=boot(undefined,"54");
  state.click("[data-open-dev]");
  const itemTab=state.node("dev-collection:items");
  state.node("#dev-collection-types").listeners.click({target:{closest(){return itemTab}}});
  assert.equal(state.node("#dev-current-section").textContent,"컬렉션 아이템");
  assert.equal(state.node("#dev-entry-count").textContent,"0개");
  assert.equal(state.storage.get(devContentKey),undefined);
});

test("story intro image paths are relative to the modular story stylesheet",()=>{
  const css=fs.readFileSync(path.join(directory,"styles/story.css"),"utf8");
  const version=JSON.parse(fs.readFileSync(path.join(directory,"site-version.json"),"utf8")).version;
  assert.ok(css.includes(`../assets/story/chapter1/house-wide.webp?v=${version}`));
  assert.ok(css.includes(`../assets/story/chapter1/house-door-close.webp?v=${version}`));
  assert.ok(css.includes(`../assets/story/chapter1/clouds-original.png?v=${version}`));
  const cloud=fs.readFileSync(path.join(directory,"assets/story/chapter1/clouds-original.png"));
  assert.equal(cloud.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  assert.equal(cloud.readUInt32BE(16),2048);
  assert.equal(cloud.readUInt32BE(20),1152);
  assert.match(css,/\.story-intro-overlay\.is-exterior \.story-sky-clouds\{\s*display:block/);
  assert.match(css,/\.story-intro-overlay\.is-door \.story-sky-clouds/);
  assert.doesNotMatch(css,/url\("\.\/assets\/story/);
});

test("travel diary opens from the story room and returns to the story room",()=>{
  const state=boot();
  state.click("#new-game-button");
  state.slotAction("new-slot",0);
  assert.equal(state.node("view:story").hidden,false);

  state.click("[data-open-collection]");
  assert.equal(state.node("view:collection").hidden,false);

  state.click("#collection-back-button");
  assert.equal(state.node("view:story").hidden,false);
  assert.equal(state.node("view:home").hidden,true);
});


test("built-in collection catalogue is completely empty",()=>{
  const context={window:{}};
  vm.runInNewContext(gameConfig,context);
  assert.equal(context.window.PixelyGameConfig.catalogue.cards.length,0);
  assert.equal(context.window.PixelyGameConfig.catalogue.items.length,0);
  assert.equal(context.window.PixelyGameConfig.catalogue.postcards.length,0);
});


test("wardrobe back button returns to the screen it was opened from",()=>{
  const state=boot();
  assert.equal(state.node("view:home").hidden,false);
  state.click("[data-open-wardrobe]");
  assert.equal(state.node("view:wardrobe").hidden,false);
  state.click("#wardrobe-back-button");
  assert.equal(state.node("view:home").hidden,false);
  assert.equal(state.node("view:wardrobe").hidden,true);
});


test("front yard uses magnifying-glass interaction markers and door exploration",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  const css=fs.readFileSync(path.join(directory,"styles/story.css"),"utf8");
  assert.match(html,/class="intro-leaves"/);
  assert.match(css,/@keyframes intro-leaf-drift/);
  assert.match(html,/id="story-intro-house"[^>]*aria-label="문 조사하기"/);
  assert.match(html,/id="story-intro-house"[\s\S]*?<span aria-hidden="true">⌕<\/span>/);
  assert.match(html,/data-intro-inspect="left"[\s\S]*?<span>⌕<\/span>/);
  assert.match(html,/data-intro-inspect="door"[\s\S]*?<span>⌕<\/span>/);
  assert.match(html,/data-intro-inspect="right"[\s\S]*?<span>⌕<\/span>/);
  assert.doesNotMatch(html,/문 클릭하기/);
});

test("door dialogue moves into exploration and entering appears only after inspecting the door",()=>{
  const context={window:{}};
  vm.runInNewContext(gameConfig,context);
  const steps=context.window.PixelyGameConfig.storyIntroSteps;
  const houseIndex=steps.findIndex(step=>step.kind==="house");
  const exploreIndex=steps.findIndex(step=>step.kind==="explore"&&step.phase==="door");
  const chapterIndex=steps.findIndex(step=>step.kind==="chapter");
  assert.ok(exploreIndex>houseIndex);
  assert.equal(steps.slice(houseIndex+1,exploreIndex).filter(step=>step.phase==="door").length,6);
  assert.equal(chapterIndex,exploreIndex+1);
  assert.match(app,/if\(action\) action\.hidden=id!=="door"/);
  assert.match(app,/showStoryIntroNotice\("문 너머에서 부산한 움직임이 들린다\. 들어가 볼까\?"\)/);
  assert.match(app,/story-intro-door-action/);
  assert.doesNotMatch(app,/function exploreStoryIntroDoor\(\)/);
});

test("door investigation messages are transient",()=>{
  const css=fs.readFileSync(path.join(directory,"styles/story.css"),"utf8");
  assert.match(app,/function showStoryIntroNotice\(text\)/);
  assert.match(app,/2200/);
  assert.match(css,/\.story-intro-explore-message\{[\s\S]*opacity:0/);
  assert.match(css,/\.story-intro-explore-message\.is-visible\{[\s\S]*opacity:1/);
});

test("map switches to outdoor locations while the intro is outside",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  assert.match(html,/id="story-map-title"/);
  assert.match(html,/id="story-map-description"/);
  assert.match(html,/id="story-map"/);
  assert.match(app,/title\.textContent="집 밖"/);
  assert.match(app,/data-story-map-node="front-yard"/);
  assert.match(app,/data-story-map-node="front-door"/);
  assert.match(app,/map\.className="story-map story-map--exterior"/);
  assert.match(css,/\.story-map--exterior\{/);
});

test("exterior and door scenes expose the game toolbar",()=>{
  const css=fs.readFileSync(path.join(directory,"styles/story.css"),"utf8");
  assert.match(css,/story-intro-overlay\.is-exterior:not\(\[hidden\]\)\) \.story-toolbar/);
  assert.match(css,/story-intro-overlay\.is-door:not\(\[hidden\]\)\) \.story-toolbar/);
  assert.match(css,/\.story-intro-overlay\.is-exterior,\s*\.story-intro-overlay\.is-door\{\s*bottom:112px/);
  assert.match(css,/\.story-side-panel\{?[^}]*z-index:110|story-intro-overlay\.is-door:not\(\[hidden\]\)\) \.story-side-panel/);
});

test("door back control is prominent and returns to the wide house step",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  const css=fs.readFileSync(path.join(directory,"styles/story.css"),"utf8");
  assert.match(html,/id="story-intro-back"[^>]*><span[^>]*>←<\/span><b>집 앞<\/b>/);
  assert.match(css,/\.story-intro-back\{[\s\S]*min-width:112px[\s\S]*border:2px solid/);
  assert.match(app,/if\(back\) back\.hidden=step\.phase!=="door"/);
  assert.match(app,/const houseIndex=storyIntroSteps\.findIndex\(entry=>entry\.kind==="house"&&entry\.phase==="exterior"\)/);
});


test("home shortcut is available before entering the house",()=>{
  const html=fs.readFileSync(path.join(directory,"index.html"),"utf8");
  const css=fs.readFileSync(path.join(directory,"styles/story.css"),"utf8");
  assert.match(html,/class="story-intro-home"[^>]*data-go-home/);
  assert.match(html,/story-intro-home[\s\S]*?<b>홈<\/b>/);
  assert.match(css,/\.story-intro-overlay\.is-exterior \.story-intro-home,[\s\S]*\.story-intro-overlay\.is-door \.story-intro-home\{[\s\S]*display:flex/);
  assert.match(app,/\$\$\("\[data-go-home\]"\)\.forEach/);
});
