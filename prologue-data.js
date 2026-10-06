/* Dialogue source: user-supplied PROLOGUE v0.1. */
(function(g){const data={
  "intro": [
    "오늘은 6월 1일",
    "잠뜰TV가 어느새 13주년을 맞은 날이다!",
    "그리고 나는 오늘...",
    "13주년을 맞아 픽셀리 분들의 집에 초대를 받았다",
    "평소에는 화면으로만 보던 사람들이",
    "다 같이 있는 곳에 직접 간다고 생각하니까…",
    "아직도 조금 실감이 안 난다",
    "오늘은 다들 뭘 하고 계실까",
    "특별한 걸 준비하고 계신 걸까",
    "아니면 그냥 평소처럼 모여 있는 걸까",
    "뭐가 됐든…",
    "직접 가보면 알겠지!"
  ],
  "scripts": {
    "arrival": [
      {
        "member": "dreamer",
        "text": "여기구나"
      },
      {
        "member": "dreamer",
        "text": "생각보다 조용하네"
      }
    ],
    "welcome-door": [
      {
        "member": "gongryong",
        "text": "어, 왔네?"
      },
      {
        "member": "dreamer",
        "text": "안녕하세요."
      },
      {
        "member": "gongryong",
        "text": "들어와. 밖에 좀 덥지?"
      }
    ],
    "welcome": [
      {
        "member": "gongryong",
        "text": "지금 좀 어수선하긴 한데.\n\n옛날 거 이것저것 꺼내놔서."
      },
      {
        "member": "deokgae",
        "text": "‘좀’?",
        "side": true,
        "place": "주방 쪽에서"
      },
      {
        "member": "gongryong",
        "text": "너 있는 데가 제일 어수선하거든?"
      },
      {
        "member": "deokgae",
        "text": "왜 갑자기 나야?",
        "side": true,
        "place": "주방 쪽에서"
      }
    ],
    "photos": [
      {
        "member": "dreamer",
        "text": "이거 꽤 오래된 사진 같은데…"
      },
      {
        "member": "rader",
        "text": "오래됐지."
      },
      {
        "member": "gongryong",
        "text": "이거 몇 년 전이지?"
      },
      {
        "member": "rader",
        "text": "네가 꺼냈잖아."
      },
      {
        "member": "gongryong",
        "text": "꺼냈다고 기억까지 해야 돼?"
      },
      {
        "member": "rader",
        "text": "보통은 그렇지."
      },
      {
        "member": "gongryong",
        "text": "…그건 그래."
      }
    ],
    "permission-question": [
      {
        "member": "gongryong",
        "text": "집 처음 와보지?"
      }
    ],
    "permission": [
      {
        "member": "gongryong",
        "text": "궁금하면 그냥 둘러봐.\n\n위에도 다 열어놨어."
      },
      {
        "member": "jamddul",
        "text": "방도 봐도 돼.\n\n오늘 어차피 다들 옛날 거 찾느라 열어놨어.",
        "side": true,
        "place": "2층 쪽에서"
      }
    ],
    "kitchen": [
      {
        "member": "suhyeon",
        "text": "왔어?"
      },
      {
        "member": "dreamer",
        "text": "안녕하세요."
      },
      {
        "member": "suhyeon",
        "text": "뭐 마실래?\n\n물도 있고—"
      },
      {
        "member": "deokgae",
        "text": "근데 이거 누가 다 마셨어?"
      },
      {
        "member": "suhyeon",
        "text": "네가 마셨겠지."
      },
      {
        "member": "deokgae",
        "text": "내가?"
      },
      {
        "member": "suhyeon",
        "text": "응."
      },
      {
        "member": "deokgae",
        "text": "너무 자연스럽게 범인 만들지 마."
      },
      {
        "member": "suhyeon",
        "text": "아니었어?"
      },
      {
        "member": "deokgae",
        "text": "…아마 아닌데."
      },
      {
        "member": "suhyeon",
        "text": "아마?"
      }
    ],
    "storage-hello": [
      {
        "member": "gakbyeol",
        "text": "어, 왔네."
      },
      {
        "member": "dreamer",
        "text": "안녕하세요."
      }
    ],
    "storage-object": [
      {
        "member": "dreamer",
        "text": "이건 뭐예요?"
      },
      {
        "member": "gakbyeol",
        "text": "음…"
      },
      {
        "member": "gakbyeol",
        "text": "모르겠는데."
      },
      {
        "member": "dreamer",
        "text": "각별님이 꺼내신 거 아니에요?"
      },
      {
        "member": "gakbyeol",
        "text": "응.\n\n꺼내고 나니까 모르겠네."
      },
      {
        "member": "gongryong",
        "text": "뭐 찾았어, 별님?",
        "side": true,
        "place": "거실 쪽에서"
      },
      {
        "member": "gakbyeol",
        "text": "이거 기억나?"
      },
      {
        "member": "gongryong",
        "text": "…뭐야?",
        "side": true,
        "place": "거실 쪽에서"
      },
      {
        "member": "gakbyeol",
        "text": "나도 몰라."
      },
      {
        "member": "gongryong",
        "text": "아니 그럼 왜 물어봐!",
        "side": true,
        "place": "거실 쪽에서"
      }
    ],
    "room-jamddul-hello": [
      {
        "member": "jamddul",
        "text": "어? 왔어?"
      },
      {
        "member": "dreamer",
        "text": "안녕하세요."
      },
      {
        "member": "jamddul",
        "text": "언제 왔어?"
      },
      {
        "member": "gongryong",
        "text": "아까!",
        "side": true,
        "place": "아래층에서"
      },
      {
        "member": "jamddul",
        "text": "너한테 안 물어봤어."
      },
      {
        "member": "gongryong",
        "text": "알려준 거잖아.",
        "side": true,
        "place": "아래층에서"
      },
      {
        "member": "jamddul",
        "text": "방 궁금하면 봐도 돼.\n\n오늘은 어차피 다 꺼내놨어."
      }
    ],
    "room-jamddul-object": [
      {
        "member": "dreamer",
        "text": "사진이 엄청 많네요."
      },
      {
        "member": "jamddul",
        "text": "13년이잖아.\n\n쌓이면 많지."
      }
    ],
    "room-gakbyeol-hello": [
      {
        "member": "gakbyeol",
        "text": "봐도 돼.\n\n근데 볼 게 있나?"
      }
    ],
    "room-gakbyeol-object": [
      {
        "member": "dreamer",
        "text": "이건 뭐예요?"
      },
      {
        "member": "gakbyeol",
        "text": "어?"
      },
      {
        "member": "gakbyeol",
        "text": "잠깐만.\n\n이거 아직 있었네?"
      },
      {
        "member": "gakbyeol",
        "text": "이거 그때 쓰다가…\n\n아, 이거 다시 해보면 되겠다."
      },
      {
        "member": "dreamer",
        "text": "갑자기요?"
      },
      {
        "member": "gakbyeol",
        "text": "응."
      }
    ],
    "room-suhyeon-hello": [
      {
        "member": "suhyeon",
        "text": "들어와도 돼.\n\n근데 진짜 별거 없어."
      }
    ],
    "room-suhyeon-object": [
      {
        "member": "suhyeon",
        "text": "그거 알아?"
      },
      {
        "member": "dreamer",
        "text": "어디서 본 것 같은데요."
      },
      {
        "member": "suhyeon",
        "text": "나도.\n\n근데 어디서 봤는지는 모르겠어."
      },
      {
        "member": "dreamer",
        "text": "수현님 물건 아니에요?"
      },
      {
        "member": "suhyeon",
        "text": "맞는데?"
      },
      {
        "member": "suhyeon",
        "text": "오래됐잖아."
      }
    ],
    "room-rader-hello": [
      {
        "member": "rader",
        "text": "보고 싶으면 봐."
      },
      {
        "member": "dreamer",
        "text": "괜찮아요?"
      },
      {
        "member": "rader",
        "text": "응.\n\n그래서 문 열어놨잖아."
      }
    ],
    "room-rader-object": [
      {
        "member": "dreamer",
        "text": "이건 뭐예요?"
      },
      {
        "member": "rader",
        "text": "아직 나도 안 봤어."
      },
      {
        "member": "rader",
        "text": "…무거운데."
      },
      {
        "member": "gongryong",
        "text": "서한솔 그거 내 거 아니야?"
      },
      {
        "member": "rader",
        "text": "네 방에 있었어?"
      },
      {
        "member": "gongryong",
        "text": "아니."
      },
      {
        "member": "rader",
        "text": "그럼 왜 네 건데."
      }
    ],
    "room-deokgae-hello": [
      {
        "member": "deokgae",
        "text": "들어오셔도 돼요.\n\n근데 뭐 엄청난 건 없어요."
      },
      {
        "member": "dreamer",
        "text": "그래도 궁금한데요."
      },
      {
        "member": "deokgae",
        "text": "왜 기대치를 올리세요."
      }
    ],
    "room-deokgae-object": [
      {
        "member": "dreamer",
        "text": "이거 기억나요."
      },
      {
        "member": "deokgae",
        "text": "진짜요?\n\n저는 왜 기억이 안 나지."
      },
      {
        "member": "deokgae",
        "text": "…아.\n\n생각났다."
      },
      {
        "member": "deokgae",
        "text": "아 이거였네!"
      }
    ],
    "room-gongryong-hello": [
      {
        "member": "gongryong",
        "text": "내 방도 볼래?"
      },
      {
        "member": "dreamer",
        "text": "봐도 돼요?"
      },
      {
        "member": "gongryong",
        "text": "왜 안 돼.\n\n들어와 봐."
      },
      {
        "member": "gongryong",
        "text": "잠깐."
      }
    ],
    "room-gongryong-object": [
      {
        "member": "gongryong",
        "text": "그건 내가 먼저 볼게."
      },
      {
        "member": "dreamer",
        "text": "왜요?"
      },
      {
        "member": "gongryong",
        "text": "나도 이게 뭔지 몰라서."
      },
      {
        "member": "dreamer",
        "text": "공룡님 방에 있었는데요?"
      },
      {
        "member": "gongryong",
        "text": "그 논리 아까 별님한테도 쓰지 않았어?"
      }
    ],
    "fairy-door": [
      {
        "member": "unknown",
        "text": "누구예요?"
      },
      {
        "member": "dreamer",
        "text": "저 꿈뜰이인데요."
      },
      {
        "member": "unknown",
        "text": "아."
      },
      {
        "member": "unknown",
        "text": "지금은 안 돼요."
      },
      {
        "member": "dreamer",
        "text": "네?"
      },
      {
        "member": "rader",
        "text": "그냥 놔둬."
      },
      {
        "member": "unknown",
        "text": "다 들리거든요?"
      },
      {
        "member": "rader",
        "text": "들으라고 했어."
      }
    ],
    "fairies": [
      {
        "member": "ttoni",
        "text": "어, 왔어요?"
      },
      {
        "member": "dreamer",
        "text": "안녕하세요."
      },
      {
        "member": "ttoni",
        "text": "여기까지 올라올 줄은 몰랐는데."
      },
      {
        "member": "yukto",
        "text": "사다리가 있는데 올라오죠."
      },
      {
        "member": "ttoni",
        "text": "그러네."
      },
      {
        "member": "dreamer",
        "text": "이거 다 옛날 자료예요?"
      },
      {
        "member": "yukto",
        "text": "네.\n\n버리면 꼭 나중에 다시 찾거든요."
      },
      {
        "member": "fritz",
        "text": "안 버려도 못 찾아요."
      },
      {
        "member": "yukto",
        "text": "그것도 맞아."
      },
      {
        "member": "philip",
        "text": "이상하다."
      },
      {
        "member": "ttoni",
        "text": "뭐가 또 없어요?"
      },
      {
        "member": "philip",
        "text": "없어진 건 아니고…\n\n다른 데로 옮긴 것 같은데."
      },
      {
        "member": "dreamer",
        "text": "이걸 다 보고 계신 거예요?"
      },
      {
        "member": "fritz",
        "text": "아니요."
      },
      {
        "member": "fritz",
        "text": "보고 싶지는 않은데 보고 있어요."
      }
    ],
    "task-question": [
      {
        "member": "philip",
        "text": "아.\n\n이거 지하로 내려갔나 보다."
      },
      {
        "member": "ttoni",
        "text": "뭐가요?"
      },
      {
        "member": "philip",
        "text": "예전에 촬영이랑 전시할 때 썼던 소품들 묶어둔 상자요."
      },
      {
        "member": "jamddul",
        "text": "그거 지하에 있을걸?"
      }
    ],
    "task-accept": [
      {
        "member": "jamddul",
        "text": "그래줄래?\n\n지하에 비슷한 거 많으니까 너무 깊이 뒤지진 말고."
      },
      {
        "member": "philip",
        "text": "큰 회색 상자예요.\n\n위에 테이프 붙어 있을 거예요."
      }
    ],
    "prism-found": [
      {
        "member": "dreamer",
        "text": "어…?"
      },
      {
        "member": "dreamer",
        "text": "이거…\n\n그때 전시에 있던 프리즘 아닌가?"
      }
    ],
    "prism-glimpse": [
      {
        "member": "dreamer",
        "text": "…방금 뭐였지?"
      }
    ],
    "anomaly": [
      {
        "member": "stage",
        "text": "아주 낮은 진동음이 들린다.",
        "delay": 1600,
        "effect": "hum"
      },
      {
        "member": "stage",
        "text": "천장 전등이 한 번 깜빡인다.",
        "delay": 900,
        "effect": "flicker"
      },
      {
        "member": "stage",
        "text": "쾅—",
        "delay": 900,
        "effect": "box-fall"
      },
      {
        "member": "dreamer",
        "text": "잠깐…"
      },
      {
        "member": "stage",
        "text": "손을 뗐는데도 진동이 멈추지 않는다.",
        "delay": 1400,
        "effect": "shake-light"
      }
    ],
    "arrivals": [
      {
        "member": "suhyeon",
        "text": "뭐야?!",
        "side": true,
        "place": "위층에서"
      },
      {
        "member": "jamddul",
        "text": "괜찮아?"
      },
      {
        "member": "dreamer",
        "text": "네. 근데 이게 갑자기—"
      },
      {
        "member": "jamddul",
        "text": "그거 건드리지 마."
      },
      {
        "member": "suhyeon",
        "text": "뭐 떨어졌어?"
      },
      {
        "member": "suhyeon",
        "text": "…저게 원래 저랬어?"
      },
      {
        "member": "dreamer",
        "text": "아니요."
      }
    ],
    "crowd": [
      {
        "member": "gongryong",
        "text": "뭐야! 뭐 터졌어?!",
        "side": true,
        "place": "계단 쪽에서"
      },
      {
        "member": "deokgae",
        "text": "아니 왜 지하에서 이런 소리가 나!",
        "side": true,
        "place": "계단 쪽에서"
      },
      {
        "member": "rader",
        "text": "천천히 내려가. 밀지 마.",
        "side": true,
        "place": "계단 쪽에서"
      },
      {
        "member": "ttoni",
        "text": "무슨 일이에요?",
        "side": true,
        "place": "계단 쪽에서"
      },
      {
        "member": "philip",
        "text": "잠깐, 저거—",
        "side": true,
        "place": "계단 쪽에서"
      },
      {
        "member": "gakbyeol",
        "text": "어?"
      },
      {
        "member": "gongryong",
        "text": "왜?"
      },
      {
        "member": "gakbyeol",
        "text": "잠깐만.\n\n저거 빛이 밖으로 나오는 게 아닌데?"
      },
      {
        "member": "gakbyeol",
        "text": "안으로 들어가고 있어."
      },
      {
        "member": "jamddul",
        "text": "다들 올라가."
      }
    ],
    "overload": [
      {
        "member": "stage",
        "text": "유리 안에서 낯선 풍경들이 빠르게 스쳐 지나간다.",
        "delay": 2400,
        "effect": "visions"
      },
      {
        "member": "dreamer",
        "text": "저거—"
      },
      {
        "member": "stage",
        "text": "빛이 안쪽으로 모여든다.",
        "delay": 1500,
        "effect": "warp"
      },
      {
        "member": "jamddul",
        "text": "이쪽으로 와!"
      },
      {
        "member": "suhyeon",
        "text": "잠깐, 잠깐—!"
      },
      {
        "member": "gongryong",
        "text": "야!"
      },
      {
        "member": "deokgae",
        "text": "잠뜰!"
      },
      {
        "member": "stage",
        "text": "잠뜰과 수현이 양쪽에서 꿈뜰이의 손목을 잡는다.",
        "delay": 1200,
        "effect": "pull"
      },
      {
        "member": "stage",
        "text": "공간이 안쪽으로 접히고—",
        "delay": 1600,
        "effect": "fold"
      }
    ]
  }
};if(typeof module!=="undefined")module.exports=data;g.PixelyPrologueData=data;})(typeof window!=="undefined"?window:globalThis);
