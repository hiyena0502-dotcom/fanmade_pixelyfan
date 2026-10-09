"use strict";
(() => {
  const categories=Object.freeze({people:{label:"인물",field:"등장 콘텐츠"},cards:{label:"카드",field:"획득 챕터"},items:{label:"아이템",field:"획득 위치"},memories:{label:"추억",field:"관련 인물"}});
  const chapter=(id,number,title="")=>({id,number,title,intro:"",description:"",chapter:"",location:"",related:"",decoration:"flower"});
  const item=(id,number,title)=>({...chapter(id,number,title),decoration:"none"});
  function catalogue(){return {
    version:1,
    chapters:[{...chapter("prologue",0,"픽셀리의 집"),intro:"모든 나들이의 시작",description:"초대장을 받고 찾아간 픽셀리의 집! 과연 오늘은 무슨 일이 기다리고 있을까?",decoration:"letter"},chapter("chapter-001",1),chapter("chapter-002",2),chapter("chapter-003",3)],
    collections:{people:["잠뜰","각별","라더","수현","공룡","덕개"].map((name,i)=>item("person-"+(i+1),i+1,name)),cards:[],items:["초대장","낡은 열쇠","꽃 배지"].map((name,i)=>item("item-"+(i+1),i+1,name)),memories:[]}
  };}
  function progress(){return {version:1,chapters:{prologue:{unlocked:true,cleared:false}},collections:{}};}
  const api=Object.freeze({categories,catalogue,progress});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;else window.PixelyBookData=api;
})();
