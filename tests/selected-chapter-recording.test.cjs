
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),C=require('../chapter-title.js');
test('the approved recording is byte-identical and ends with the 4.8-second title',()=>{
 const bytes=fs.readFileSync(require.resolve('../assets/audio/chapter-dungdu-higher-oct12.wav'));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'c940aae90a012eab46188e9469b5975215660b377c190c70b97f1d446a287e61');
 assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WAVE');let rate,channels,pcm;
 for(let at=12;at+8<=bytes.length;){const size=bytes.readUInt32LE(at+4),kind=bytes.toString('ascii',at,at+4);if(kind==='fmt '){assert.equal(bytes.readUInt16LE(at+8),1);channels=bytes.readUInt16LE(at+10);rate=bytes.readUInt32LE(at+12);assert.equal(bytes.readUInt16LE(at+22),16);}if(kind==='data')pcm=bytes.subarray(at+8,at+8+size);at+=8+size+(size%2);}
 assert.equal(channels,1);assert.equal(rate,48000);assert.equal(C.soundStart+pcm.length/2/rate*1000,C.duration);assert.equal(C.titleSettle-C.soundStart,280);assert.equal(pcm.readInt16LE(0),0);assert.equal(pcm.readInt16LE(pcm.length-2),0);
});
