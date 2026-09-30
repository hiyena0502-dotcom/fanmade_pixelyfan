(() => {
  "use strict";

  const devSchemas={
    cards:[
      {key:"id",label:"ID",type:"text",placeholder:"character-id"},
      {key:"name",label:"이름",type:"text",placeholder:"인물 이름"},
      {key:"type",label:"분류 TYPE",type:"text",placeholder:"PERSON / FAIRY / CREATURE"},
      {key:"symbol",label:"표시 문자",type:"text",placeholder:"잠"},
      {key:"color",label:"색상",type:"color"},
      {key:"world",label:"상황극·세계",type:"text",placeholder:"비우면 기본 인물"},
      {key:"desc",label:"설명",type:"textarea",placeholder:"카드 설명"},
      {key:"memo",label:"꿈뜰이 메모",type:"textarea",placeholder:"카드 메모"}
    ],
    items:[
      {key:"id",label:"ID",type:"text",placeholder:"item-id"},
      {key:"name",label:"이름",type:"text",placeholder:"아이템 이름"},
      {key:"type",label:"분류 TYPE",type:"text",placeholder:"KEY / MEMENTO / GIFT / DECOR"},
      {key:"symbol",label:"표시 문자",type:"text",placeholder:"✦"},
      {key:"color",label:"색상",type:"color"},
      {key:"desc",label:"설명",type:"textarea",placeholder:"아이템 설명"},
      {key:"wardrobeSlot",label:"옷장 분류",type:"select",options:[["","사용 안 함"],["outfit","옷"],["accessory","소품"],["face","얼굴"],["decoration","장식"]]},
      {key:"wardrobeGroup",label:"세부 파츠",type:"text",placeholder:"예: eyes / top / hand"}
    ],
    postcards:[
      {key:"id",label:"ID",type:"text",placeholder:"postcard-id"},
      {key:"name",label:"이름",type:"text",placeholder:"엽서 제목"},
      {key:"type",label:"분류 TYPE",type:"text",placeholder:"STORY POSTCARD"},
      {key:"symbol",label:"표시 문자",type:"text",placeholder:"✦"},
      {key:"color",label:"색상",type:"color"},
      {key:"desc",label:"설명",type:"textarea",placeholder:"엽서 설명"},
      {key:"caption",label:"캡션",type:"textarea",placeholder:"엽서 한마디"}
    ]
  };

  window.PixelyEditorSchema={devSchemas};
})();
