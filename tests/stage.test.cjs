'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),S=require('../stage.js');
test('the production viewport fits wide and narrow browser areas without cropping or unequal margins',()=>{
  for(const [w,h] of [[3000,1440],[3440,1440],[2520,1080],[1920,1080],[1920,1200],[1600,1200],[800,600]]){
    const f=S.fit(w,h);
    assert.equal(f.width,3000);assert.equal(f.height,1440);
    assert.ok(Math.abs(f.displayWidth/f.displayHeight-25/12)<1e-12);
    assert.ok(f.displayWidth<=w+1e-9&&f.displayHeight<=h+1e-9);
    assert.ok(Math.abs(w-f.displayWidth-f.left*2)<1e-9);
    assert.ok(Math.abs(h-f.displayHeight-f.top*2)<1e-9);
  }
  assert.deepEqual(S.fit(3440,1440),{width:3000,height:1440,scale:1,displayWidth:3000,displayHeight:1440,left:220,top:0});
});
test('whole-stage scaling preserves legacy image and click coordinates when converted back from pointer pixels',()=>{
  const point={x:719.3,y:875.7};
  for(const [w,h] of [[3440,1440],[1920,1080],[800,600]]){
    const f=S.fit(w,h),pointer={x:f.left+point.x*f.scale,y:f.top+point.y*f.scale};
    assert.ok(Math.abs((pointer.x-f.left)/f.scale-point.x)<1e-9);
    assert.ok(Math.abs((pointer.y-f.top)/f.scale-point.y)<1e-9);
  }
});
