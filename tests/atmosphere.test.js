const {test}=require('node:test');
const assert=require('node:assert/strict');
const {cloudPlan}=require('../atmosphere.js');
test('clouds travel left, wrap beyond both edges, and never catch or overlap their neighbours',()=>{
  let seed=1234567;
  const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let run=0;run<500;run++){
    const plan=cloudPlan(random);
    assert.equal(plan.length,6);
    for(const cloud of plan){
      assert.ok(cloud.end<cloud.start);
      assert.equal(cloud.duration,plan[0].duration);
      assert.ok(130-cloud.width/2>100);
      assert.ok(-170+cloud.width/2<0);
    }
    for(const elapsed of [0,80,200,400,10000]){
      const positions=plan.map(c=>({...c,x:(c.phase+elapsed/c.duration*300)%300})).sort((a,b)=>a.x-b.x);
      for(let n=0;n<6;n++){
        const a=positions[n],b=positions[(n+1)%6];
        const gap=(b.x-a.x+300)%300-(a.width+b.width)/2;
        assert.ok(gap>10,'visible cloud silhouettes retain a gap through repeated cycles');
      }
    }
  }
});
