/* Save validation and progression are shared by the browser and regression tests. */
(function(g){
  'use strict';
  const members=['suhyeon','gakbyeol','jamddul','rader','deokgae','gongryong'];
  const scenes=['exterior','door-closeup','living-room','kitchen','storage','stairs','bathroom','upper-hall','attic','basement',...members.map(m=>'room-'+m)];
  const fresh=()=>({schema:1,scene:'exterior',introDone:false,introIndex:0,flags:{prologue_started:true},done:[],inventory:[],history:[],journal:[],rotation:0,angle:0,pending:null,ending:false,savedAt:0});
  const strings=x=>Array.isArray(x)?[...new Set(x.filter(v=>typeof v==='string'))]:[];
  function normalize(x){
    if(!x||x.schema!==1||!scenes.includes(x.scene))return null;
    const s={...fresh(),...x};
    s.flags=x.flags&&typeof x.flags==='object'&&!Array.isArray(x.flags)?Object.fromEntries(Object.entries(x.flags).map(([k,v])=>[k,!!v])):{};
    s.done=strings(x.done);s.inventory=strings(x.inventory);s.journal=strings(x.journal);
    s.history=Array.isArray(x.history)?x.history.filter(v=>v&&typeof v.member==='string'&&typeof v.text==='string').slice(-600):[];
    s.rotation=Math.max(0,Math.min(3,Number.isInteger(x.rotation)?x.rotation:0));
    s.angle=Number.isFinite(x.angle)?x.angle:0;
    s.introIndex=Math.max(0,Number.isInteger(x.introIndex)?x.introIndex:0);
    s.pending=x.pending&&typeof x.pending.id==='string'&&typeof x.pending.state==='object'?x.pending:null;
    return s;
  }
  function objective(s){
    if(s.ending)return '프롤로그 완료';
    if(s.flags.prism_anomaly_started)return '프리즘에서 떨어지자';
    if(s.flags.prism_found)return '프리즘을 살펴보자';
    if(s.flags.basement_task_started)return s.flags.target_box_found?'상자 주변의 소품을 살펴보자':'지하에서 옛 소품 상자를 찾자';
    if(s.flags.house_roam_enabled)return '집을 둘러보고 다락에 올라가 보자';
    return s.flags.entered_house?'거실의 오래된 사진을 살펴보자':'집에 들어가자';
  }
  function canTravel(s,to){
    if(s.ending||s.flags.prism_anomaly_started)return false;
    if(to.startsWith('room-'))return !!s.flags.room_tour_permission;
    if(['kitchen','storage','stairs','bathroom','upper-hall','attic','basement'].includes(to))return !!s.flags.house_roam_enabled;
    return true;
  }
  const api={members,scenes,fresh,normalize,objective,canTravel};
  if(typeof module!=='undefined')module.exports=api;
  g.PixelyPrologueState=api;
})(typeof window!=='undefined'?window:globalThis);
