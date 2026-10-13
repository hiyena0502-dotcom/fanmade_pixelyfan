'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('../front-scene.js'),D=require('../game-data.js'),Loader=require('../scene-transition.js');
const scene={id:'front',builtin:'house',background:''};
test('all eleven full-canvas lossless images have a stable background-to-foreground order',()=>{
 assert.equal(F.sources(scene).length,11);assert.equal(new Set(F.sources(scene)).size,11);
 const order=id=>F.LAYERS.findIndex(l=>l.id===id);assert.ok(order('ground')<order('fence'));assert.ok(order('ground')<order('house'));assert.ok(order('house')<order('side-bushes'));
 assert.deepEqual(F.LAYERS.filter(l=>l.plane==='front').map(l=>l.id),['foreground-bushes']);
 const manifest=require('../assets/scenes/front-oct13/source-manifest.json');
 for(const layer of F.LAYERS){const entry=manifest.find(e=>e.id===layer.id),bytes=fs.readFileSync(require('node:path').join(__dirname,'..',layer.src));assert.equal(entry.plane,layer.plane);assert.equal(bytes.toString('ascii',12,16),'VP8L');assert.equal(bytes[20],0x2f);const bits=bytes.readUInt32LE(21);assert.equal((bits&0x3fff)+1,1920);assert.equal(((bits>>>14)&0x3fff)+1,1080);}
 for(const custom of [{...scene,background:'scene:front'},{...scene,id:'hall'},{...scene,builtin:'blank'}])assert.deepEqual(F.sources(custom),[]);
});
test('old built-in door and bush hitboxes follow the new image while edited data and events survive',()=>{
 const original=D.defaults(),copy=structuredClone(original),next=F.adapt(original),front=next.locations[0];assert.deepEqual(original,copy);
 assert.deepEqual(front.objects.find(o=>o.id==='door').rect,{x:48,y:60,w:4,h:13});assert.deepEqual(front.objects.find(o=>o.id==='bush').rect,{x:55,y:66,w:7,h:10});
 assert.deepEqual(next.events,original.events);assert.deepEqual(front.objects.find(o=>o.id==='invitation'),original.locations[0].objects.find(o=>o.id==='invitation'));assert.deepEqual(F.adapt(next),next);
 copy.locations[0].objects.find(o=>o.id==='door').rect.x=51;assert.equal(F.adapt(copy).locations[0].objects.find(o=>o.id==='door').rect.x,51);
 copy.locations[0].background='uploaded-background';assert.deepEqual(F.adapt(copy),copy);
});
function host(){const nodes=[];const h={nodes,classList:{toggle(){}},ownerDocument:{createElement(){return {dataset:{},style:{},remove(){nodes.splice(nodes.indexOf(this),1);},animate(){}};}},append:n=>nodes.push(n),prepend:n=>nodes.unshift(n),querySelectorAll:()=>nodes.filter(n=>n.className==='front-scene-layer')};return h;}
test('foreground bushes remain separate, never duplicate, and clear when switching to an uploaded scene',()=>{
 const back=host(),front=host(),authored={className:'scene-image-layer',id:'author-decoration'};front.nodes.push(authored);
 assert.equal(F.renderBack(back,scene),true);assert.equal(back.nodes.length,10);F.renderForeground(front,scene);F.renderForeground(front,scene);assert.equal(front.nodes.length,2);assert.equal(front.nodes[0].dataset.frontSceneLayer,'foreground-bushes');assert.equal(front.nodes[0].style.zIndex,'-1');assert.equal(front.nodes[1],authored);
 F.renderForeground(front,{...scene,background:'uploaded'});assert.deepEqual(front.nodes,[authored]);
});
test('the house-front scene waits for its foreground image before appearing',async()=>{
 const pending=[];class Image{set src(value){this.url=value;pending.push(this);}decode(){return Promise.resolve();}}
 let ready=false;const task=Loader.create(Image).prepare(F.sources(scene)).then(()=>ready=true);
 assert.equal(pending.length,11);for(const img of pending.slice(0,-1))img.onload();await Promise.resolve();assert.equal(ready,false);pending.at(-1).onload();await task;assert.equal(ready,true);
});
