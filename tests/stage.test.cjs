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

test('menus extend their reference canvas to fill the browser while keeping readable UI independent',()=>{
  for(const [w,h] of [[3440,1440],[2520,1080],[1920,1080],[1920,1200],[1600,1200],[800,600]]){
    const home=S.homeFit(w,h),ui=S.uiFit(S.menuFit(w,h));
    assert.ok(home.width>=3000-1e-9);assert.ok(home.height>=1440-1e-9);
    assert.deepEqual(home,S.menuFit(w,h));assert.equal(home.left,0);assert.equal(home.top,0);assert.equal(home.displayWidth,w);assert.equal(home.displayHeight,h);
    assert.ok(Math.abs(home.width*home.scale-home.displayWidth)<1e-9);
    assert.ok(ui.zoom>=1&&ui.zoom<=2.5);
    assert.ok(Math.abs(ui.width*ui.zoom-home.width)<1e-9&&Math.abs(ui.height*ui.zoom-home.height)<1e-9);
  }
  assert.ok(Math.abs(S.uiFit(S.fit(2520,1080)).zoom*.75-1.18)<1e-9);
  assert.equal(S.uiFit(S.fit(3440,1440)).zoom,1.18);
});

test('only gameplay uses 1920 by 1080 and symmetric viewport pillars',()=>{
 for(const [w,h] of [[3440,1440],[2520,1080],[1920,1080],[1920,1200],[1600,1200],[800,600]]){
  const f=S.gameFit(w,h);assert.equal(f.width,1920);assert.equal(f.height,1080);
  assert.ok(Math.abs(f.displayWidth/f.displayHeight-16/9)<1e-12);
  assert.ok(f.displayWidth<=w+1e-9&&f.displayHeight<=h+1e-9);
  assert.ok(Math.abs(w-f.displayWidth-f.left*2)<1e-9);assert.ok(Math.abs(h-f.displayHeight-f.top*2)<1e-9);
  for(const [x,y] of [[0,0],[.42,.57],[1,1]]){
   const px=f.left+x*f.displayWidth,py=f.top+y*f.displayHeight;
   assert.ok(Math.abs((px-f.left)/f.scale-f.width*x)<1e-9);
   assert.ok(Math.abs((py-f.top)/f.scale-f.height*y)<1e-9);
  }
 }
 assert.deepEqual(S.gameFit(2520,1080),{width:1920,height:1080,scale:1,displayWidth:1920,displayHeight:1080,left:300,top:0});
});
test('a page changes coordinates only when actual play begins and restores menu coordinates',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),values=new Map(),classes=new Set();
 const html={clientWidth:2520,clientHeight:1080,dataset:{screen:'game'},style:{setProperty:(k,v)=>values.set(k,v)},classList:{add:k=>classes.add(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)}};
 const window={document:{documentElement:html},addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../stage.js'),'utf8'),{window});
 assert.equal(window.PixelyStage.frame.width,3360);assert.equal(values.get('--stage-height'),'1440px');
 window.PixelyStage.setPlaying(true);assert.equal(window.PixelyStage.frame.width,1920);assert.equal(values.get('--stage-height'),'1080px');assert.ok(classes.has('pixely-game-playing'));
 window.PixelyStage.setPlaying(false);assert.equal(window.PixelyStage.frame.width,3360);assert.ok(!classes.has('pixely-game-playing'));
});
