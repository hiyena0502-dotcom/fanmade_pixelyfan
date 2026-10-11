'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),P=require('../monologue-model.js'),M=require('../game-model.js'),D=require('../game-data.js');
test('image layers share ordered, proportion-preserving motion data across scenes and events',()=>{
 const layer={id:'portrait',name:'사용자 업로드',asset:'event:layer:portrait',actor:'gong',animation:'sway',duration:8,amount:12,plane:'back'};const d=D.defaults();d.locations[0].layers=[layer];d.eventLayers={opening:[{...layer,id:'other',animation:'float'}]};const c=M.content(d);assert.equal(c.locations[0].layers[0].fit,'contain');assert.equal(c.locations[0].layers[0].plane,'back');assert.equal(c.eventLayers.opening[0].animation,'float');assert.equal(c.eventLayers.opening[0].duration,8);assert.notEqual(c.locations[0].layers,d.locations[0].layers);c.eventLayers.opening[0].actor='missing';assert.throws(()=>M.content(c));d.eventLayers.missing=[];assert.throws(()=>M.content(d));
});
test('layers reject malformed uploads, duplicate IDs and invalid effects while keeping fit explicit',()=>{
 const layer={id:'a',name:'등록 이미지',asset:'event:layer:a',animation:'none'};assert.equal(P.layers([{...layer,fit:'cover'}])[0].fit,'cover');for(const list of [[layer,layer],[{...layer,asset:'javascript:alert(1)'}],[{...layer,animation:'script'}],Array(101).fill(layer)])assert.throws(()=>P.layers(list));
});
