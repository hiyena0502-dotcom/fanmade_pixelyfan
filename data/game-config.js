(() => {
  "use strict";

const catalogue = {
  cards: [],
  items: [],
  postcards: []
};


const wardrobeSlots=["outfit","accessory","face","decoration"];
const wardrobeLabels={outfit:"옷",accessory:"소품",face:"얼굴",decoration:"장식"};
const wardrobeGroups={
  outfit:[["top","상의"],["bottom","하의"],["outer","겉옷"],["shoes","신발"],["other","기타 의상"]],
  accessory:[["hand","손에 드는 소품"],["wear","착용 소품"],["head","머리 소품"],["other","기타 소품"]],
  face:[["eyes","눈"],["mouth","입"],["brows","눈썹"],["cheek","볼·표정"],["other","기타 얼굴"]],
  decoration:[["effect","이펙트"],["sticker","스티커"],["around","주변 장식"],["other","기타 장식"]]
};

const collectionFilters={
  cards:[{id:"all",label:"전체"},{id:"crew",label:"잠뜰 멤버"},{id:"roleplay",label:"상황극 인물"},{id:"fairy",label:"요정"},{id:"other",label:"기타 인물·생물"}],
  items:[{id:"all",label:"전체"},{id:"key",label:"중요 물건"},{id:"memento",label:"기념품"},{id:"gift",label:"선물·편지"},{id:"wardrobe",label:"꾸미기"},{id:"unknown",label:"미확인"}]
};

const chapters = [
  {id:"night",no:"01",title:"생일 전날 밤",label:"CHAPTER 01",desc:"내용 준비 중"},
  {id:"morning",no:"02",title:"사라진 생일 주인공",label:"CHAPTER 02",desc:"아침에 잠뜰님을 찾고, 요정들이 발견한 장치를 살펴본다. 다음 업데이트에서 이어진다."},
  {id:"portal",no:"03",title:"처음 열린 문",label:"CHAPTER 03",desc:"수리한 장치가 연 문으로 들어가 첫 세계로 향한다."},
  {id:"journey",no:"04",title:"이야기 속 잠뜰",label:"CHAPTER 04",desc:"여러 세계를 돌아다니며 그곳의 잠뜰을 만난다."},
  {id:"birthday",no:"05",title:"푸른 하늘",label:"FINAL",desc:"현실의 잠뜰님을 데려와 함께 생일을 축하한다."}
];

const storyIntroSteps=[
  {phase:"dark",kind:"narration",text:"내일은 잠뜰님의 생일이다."},
  {phase:"dark",kind:"narration",text:"그래서 나는 오늘, 조금 일찍 이곳에 왔다."},
  {phase:"dark",kind:"narration",text:"이유는 간단하다."},
  {phase:"dark",kind:"narration",text:"생일 축하하러 왔을 뿐이다."},
  {phase:"dark",kind:"narration",text:"……정말 그것뿐이었는데."},

  {phase:"exterior",kind:"dialogue",speaker:"꿈뜰이",text:"여기 맞겠지?"},
  {phase:"exterior",kind:"dialogue",speaker:"꿈뜰이",text:"생각보다 조용한데……."},

  {phase:"exterior",kind:"house"},

  {phase:"door",kind:"dialogue",speaker:"수현",text:"잠깐만! 그 상자 거기 두면 안 돼!"},
  {phase:"door",kind:"dialogue",speaker:"공룡",text:"아니, 내가 안 뒀다니까?!"},
  {phase:"door",kind:"dialogue",speaker:"덕개",text:"그럼 바닥에 떨어진 리본은 누가 밟았는데?"},
  {phase:"door",kind:"dialogue",speaker:"라더",text:"잠깐, 다들 한 번만 멈춰봐!"},

  {phase:"door",kind:"narration",text:"익숙한 소음과 친근한 목소리다……"},
  {phase:"door",kind:"narration",text:"…잘 찾아온 것 같다."},
  {phase:"door",kind:"explore"},

  {phase:"chapter",kind:"chapter",kicker:"CHAPTER 1",title:"생일 전날",text:"잠뜰님의 생일 파티를 준비하자."}
];

const storyHotspots={
  window:{label:"창문",text:"창밖은 조용한 밤이다. 아직 파티가 시작될 기색은 없다."},
  table:{label:"테이블",text:"넓은 테이블이 비어 있다. 케이크도 선물도 장식도 아직 아무것도 없다."},
  bookshelf:{label:"책장",text:"오래된 책과 작은 소품들이 정리되어 있다. 지금 당장 필요한 물건은 없어 보인다."},
  gramophone:{label:"축음기",text:"오래된 축음기다. 파티 때 음악을 틀 수 있을지도 모르겠다."}
};

  window.PixelyGameConfig={
    catalogue,
    wardrobeSlots,
    wardrobeLabels,
    wardrobeGroups,
    collectionFilters,
    chapters,
    storyIntroSteps,
    storyHotspots
  };
})();
