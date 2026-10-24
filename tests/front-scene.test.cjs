'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('../front-scene.js'),D=require('./fixtures/game-sandbox.cjs'),Loader=require('../scene-transition.js');
const scene={id:'front',builtin:'house',background:''};
test('all eleven full-canvas lossless images have a stable background-to-foreground order',()=>{
 assert.equal(F.sources(scene).length,17);assert.equal(new Set(F.sources(scene)).size,17);
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
function host(){const nodes=[];const h={nodes,classList:{toggle(){}},ownerDocument:{createElement(){return {dataset:{},style:{},children:[],setAttribute(){},addEventListener(){},append(n){this.children.push(n);},remove(){nodes.splice(nodes.indexOf(this),1);},animate(){}};}},append:n=>nodes.push(n),prepend:n=>nodes.unshift(n),querySelectorAll:()=>nodes.filter(n=>n.className==='front-scene-layer')};return h;}
test('foreground bushes remain separate, never duplicate, and clear when switching to an uploaded scene',()=>{
 const back=host(),front=host(),authored={className:'scene-image-layer',id:'author-decoration'};front.nodes.push(authored);
 assert.equal(F.renderBack(back,scene),true);assert.equal(back.nodes.length,11);F.renderForeground(front,scene);F.renderForeground(front,scene);assert.equal(front.nodes.length,2);assert.equal(front.nodes[0].dataset.frontSceneLayer,'foreground-bushes');assert.equal(front.nodes[0].style.zIndex,'-1');assert.equal(front.nodes[1],authored);
 F.renderForeground(front,{...scene,background:'uploaded'});assert.deepEqual(front.nodes,[authored]);
});
test('the house-front scene waits for its foreground image before appearing',async()=>{
 const pending=[];class Image{set src(value){this.url=value;pending.push(this);}decode(){return Promise.resolve();}}
 let ready=false;const task=Loader.create(Image).prepare(F.sources(scene)).then(()=>ready=true);
 assert.equal(pending.length,17);for(const img of pending.slice(0,-1))img.onload();await Promise.resolve();assert.equal(ready,false);pending.at(-1).onload();await task;assert.equal(ready,true);
});

test('all six cloud canvases share one plane behind the house and retain proportional transparent crops',()=>{
 assert.equal(F.CLOUDS.length,6);assert.ok(F.CLOUDS.every(c=>c.plane==='behind'));
 const back=host();F.renderBack(back,scene,50000);const planes=back.nodes.filter(n=>n.className.startsWith('front-cloud-plane'));assert.equal(planes.length,1);assert.equal(planes[0].className,'front-cloud-plane behind');assert.equal(planes[0].children.length,6);
 for(const frame of planes[0].children){const c=F.CLOUDS.find(c=>String(c.id)===frame.dataset.cloud),bytes=fs.readFileSync(c.src);assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),2048);assert.equal(bytes.readUInt32BE(20),1152);assert.equal(bytes[25],6);const [x,y,w,h]=c.crop;assert.ok(x>=0&&y>=0&&x+w<=2048&&y+h<=1152);assert.equal(frame.style.aspectRatio,w+'/'+h);assert.ok(parseFloat(frame.style.width)<30,'a cloud fully exits before its next randomized crossing');assert.equal(frame.children[0].src,c.src);const state=F.cloudState(c,50000);assert.equal(frame.style.animationDelay,-(50000-state.start)/1000+'s');}
 const redraw=host();F.renderBack(redraw,scene,80000);const frames=redraw.nodes.filter(n=>n.className.startsWith('front-cloud-plane')).flatMap(n=>n.children);for(const frame of frames){const c=F.CLOUDS.find(c=>String(c.id)===frame.dataset.cloud),state=F.cloudState(c,80000);assert.equal(frame.style.animationDelay,-(80000-state.start)/1000+'s','dialogue redraws continue the existing cloud timeline');}
});
test('cloud crossings randomize independently at fully offscreen boundaries and stay reproducible within a session',()=>{
 const variants=[];for(const c of F.CLOUDS){const first=F.cloudState(c,0,12345);assert.deepEqual(F.cloudState(c,0,12345),first);const boundary=first.start+first.duration*1000,following=F.cloudState(c,boundary+1,12345);assert.equal(following.cycle,first.cycle+1);assert.equal(following.start,boundary);assert.notEqual(following.duration,first.duration);assert.notEqual(following.width,first.width);assert.notEqual(following.top,first.top);assert.equal(F.cloudState(c,boundary-1,12345).cycle,first.cycle);for(const sample of [first,following]){assert.ok(sample.width>=11&&sample.width<19);assert.ok(sample.top>=2&&sample.top<18);assert.ok(sample.duration>=125&&sample.duration<205);assert.ok(sample.opacity>=.66&&sample.opacity<.88);}variants.push(first);assert.notDeepEqual(F.cloudState(c,0,54321),first);}
 assert.equal(new Set(variants.map(v=>v.duration)).size,6);assert.equal(new Set(variants.map(v=>v.top)).size,6);
});
