import type { MatchingQuestion } from "../bibleQuiz";
import { getDifficulty, questionId, rotate } from "./shared";

type MatchingItem = {
  theme: string;
  pairs: Array<{ left: string; right: string }>;
  explanation: string;
  reference: string;
};

const levelData: Record<number, MatchingItem[]> = {
  1: [
    {
      theme: "창조의 날들",
      pairs: [
        { left: "첫째 날", right: "빛을 만드심" },
        { left: "둘째 날", right: "궁창(하늘)을 만드심" },
        { left: "셋째 날", right: "뭍과 바다와 식물을 만드심" },
        { left: "넷째 날", right: "해와 달과 별을 만드심" },
      ],
      explanation: "하나님께서 엿새 동안 각기 다른 것을 창조하셨다.",
      reference: "창세기 1:3-19",
    },
    {
      theme: "에덴동산과 첫 사람",
      pairs: [
        { left: "아담", right: "흙으로 지음 받은 첫 사람" },
        { left: "하와", right: "아담의 갈빗대로 지음 받은 여자" },
        { left: "선악과", right: "먹지 말라 명하신 나무의 열매" },
        { left: "뱀", right: "하와를 꾀어 죄짓게 한 자" },
      ],
      explanation: "에덴동산의 첫 사람과 타락의 등장인물들이다.",
      reference: "창세기 2:7-3:6",
    },
    {
      theme: "가인과 아벨",
      pairs: [
        { left: "가인", right: "땅을 가는 농부였던 아담의 맏아들" },
        { left: "아벨", right: "양치는 자로 합당한 제사를 드린 자" },
        { left: "셋", right: "아벨을 대신해 태어난 셋째 아들" },
      ],
      explanation: "아담의 아들들과 각자의 역할이다.",
      reference: "창세기 4:1-25",
    },
    {
      theme: "노아의 홍수",
      pairs: [
        { left: "노아", right: "방주를 지은 의로운 사람" },
        { left: "방주", right: "잣나무로 만든 큰 배" },
        { left: "비둘기", right: "감람나무 잎을 물어온 새" },
        { left: "무지개", right: "다시 멸하지 않으시겠다는 언약의 표징" },
      ],
      explanation: "홍수 심판과 노아 언약의 핵심 요소들이다.",
      reference: "창세기 6:14-9:13",
    },
    {
      theme: "바벨탑",
      pairs: [
        { left: "바벨탑", right: "하늘에 닿게 쌓으려던 성과 탑" },
        { left: "언어 혼잡", right: "하나님께서 내리신 심판" },
        { left: "온 땅에 흩어짐", right: "사람들이 받은 결과" },
      ],
      explanation: "교만한 인간의 시도와 그 결과이다.",
      reference: "창세기 11:1-9",
    },
    {
      theme: "아브라함의 언약",
      pairs: [
        { left: "아브라함", right: "믿음의 조상으로 부르심 받은 자" },
        { left: "갈대아 우르", right: "아브라함이 떠난 고향" },
        { left: "이삭", right: "약속으로 태어난 아들" },
        { left: "할례", right: "언약의 표로 받은 의식" },
      ],
      explanation: "아브라함을 향한 부르심과 언약의 요소들이다.",
      reference: "창세기 12:1-17:11",
    },
    {
      theme: "롯과 소돔",
      pairs: [
        { left: "롯", right: "소돔에 거주한 아브라함의 조카" },
        { left: "소돔과 고모라", right: "유황불로 멸망한 죄악의 성" },
        { left: "롯의 아내", right: "뒤돌아보다 소금 기둥이 된 자" },
      ],
      explanation: "소돔의 심판과 관련된 인물들이다.",
      reference: "창세기 19:1-26",
    },
    {
      theme: "이삭과 리브가",
      pairs: [
        { left: "이삭", right: "아브라함이 바치려 했던 약속의 아들" },
        { left: "리브가", right: "우물가에서 만난 이삭의 아내" },
        { left: "에서", right: "장자권을 판 이삭의 큰아들" },
        { left: "야곱", right: "축복을 가로챈 이삭의 작은아들" },
      ],
      explanation: "이삭 가정의 인물과 관계이다.",
      reference: "창세기 22:1-27:36",
    },
    {
      theme: "야곱의 생애",
      pairs: [
        { left: "벧엘", right: "야곱이 하늘 사다리 꿈을 꾼 곳" },
        { left: "라반", right: "야곱이 섬긴 외삼촌" },
        { left: "라헬", right: "야곱이 사랑한 아내" },
        { left: "이스라엘", right: "씨름 후 야곱이 받은 새 이름" },
      ],
      explanation: "야곱의 여정과 이름의 변화이다.",
      reference: "창세기 28:12-32:28",
    },
    {
      theme: "요셉 이야기",
      pairs: [
        { left: "요셉", right: "채색옷을 입고 형들에게 팔린 자" },
        { left: "보디발", right: "요셉이 종으로 섬긴 애굽 관원" },
        { left: "바로의 꿈", right: "요셉이 해석한 일곱 풍년과 흉년의 꿈" },
        { left: "총리", right: "요셉이 오른 애굽의 직위" },
      ],
      explanation: "요셉의 고난과 높아짐의 과정이다.",
      reference: "창세기 37:3-41:43",
    },
  ],
  2: [
    {
      theme: "모세의 출생과 부르심",
      pairs: [
        { left: "갈대 상자", right: "아기 모세를 담아 나일강에 둔 것" },
        { left: "바로의 딸", right: "모세를 건져 기른 자" },
        { left: "미디안", right: "모세가 피신한 광야 땅" },
        { left: "불타는 떨기나무", right: "하나님이 모세를 부르신 곳" },
      ],
      explanation: "모세의 출생과 소명의 장면들이다.",
      reference: "출애굽기 2:3-3:4",
    },
    {
      theme: "열 가지 재앙",
      pairs: [
        { left: "첫째 재앙", right: "나일강 물이 피가 됨" },
        { left: "여덟째 재앙", right: "메뚜기 떼가 덮침" },
        { left: "아홉째 재앙", right: "사흘 동안 흑암이 임함" },
        { left: "열째 재앙", right: "장자의 죽음" },
      ],
      explanation: "애굽에 임한 재앙들의 순서이다.",
      reference: "출애굽기 7:20-12:29",
    },
    {
      theme: "유월절",
      pairs: [
        { left: "어린 양", right: "흠 없이 잡은 유월절 제물" },
        { left: "문설주의 피", right: "죽음의 사자가 넘어가게 한 표" },
        { left: "무교병", right: "누룩 없이 급히 만든 떡" },
      ],
      explanation: "유월절 규례의 핵심 요소들이다.",
      reference: "출애굽기 12:5-20",
    },
    {
      theme: "홍해를 건넘",
      pairs: [
        { left: "홍해", right: "갈라져 마른 땅이 된 바다" },
        { left: "모세의 지팡이", right: "바다 위로 내밀어 길을 연 도구" },
        { left: "바로의 군대", right: "물에 빠져 멸망한 추격자들" },
        { left: "미리암", right: "소고를 잡고 찬양을 인도한 여선지자" },
      ],
      explanation: "홍해 도하 사건의 인물과 사물이다.",
      reference: "출애굽기 14:21-15:21",
    },
    {
      theme: "광야의 양식",
      pairs: [
        { left: "만나", right: "아침마다 내린 하늘 양식" },
        { left: "메추라기", right: "저녁에 진영을 덮은 고기" },
        { left: "반석의 물", right: "지팡이로 쳐서 솟아난 물" },
      ],
      explanation: "광야에서 백성을 먹이신 공급들이다.",
      reference: "출애굽기 16:13-17:6",
    },
    {
      theme: "십계명",
      pairs: [
        { left: "시내산", right: "하나님이 율법을 주신 산" },
        { left: "두 돌판", right: "십계명이 새겨진 판" },
        { left: "제1계명", right: "다른 신을 두지 말라" },
        { left: "제5계명", right: "네 부모를 공경하라" },
      ],
      explanation: "시내산 언약과 십계명의 내용이다.",
      reference: "출애굽기 20:1-31:18",
    },
    {
      theme: "금송아지 사건",
      pairs: [
        { left: "아론", right: "금송아지를 만든 제사장" },
        { left: "금송아지", right: "백성이 섬긴 우상" },
        { left: "모세", right: "돌판을 깨뜨린 지도자" },
        { left: "레위 자손", right: "심판 집행에 나선 지파" },
      ],
      explanation: "금송아지 우상숭배와 그 결과이다.",
      reference: "출애굽기 32:1-28",
    },
    {
      theme: "성막",
      pairs: [
        { left: "법궤", right: "증거판을 담은 지성소의 궤" },
        { left: "분향단", right: "향을 사르는 금단" },
        { left: "등잔대", right: "순금으로 만든 일곱 등잔" },
        { left: "물두멍", right: "제사장이 손발을 씻는 놋대야" },
      ],
      explanation: "성막의 주요 기구들이다.",
      reference: "출애굽기 25:10-30:21",
    },
    {
      theme: "정탐꾼 사건",
      pairs: [
        { left: "열두 정탐꾼", right: "가나안을 탐지하러 보낸 자들" },
        { left: "여호수아와 갈렙", right: "믿음으로 보고한 두 사람" },
        { left: "사십 년", right: "광야에서 방황한 기간" },
      ],
      explanation: "가나안 정탐과 불신앙의 결과이다.",
      reference: "민수기 13:1-14:34",
    },
    {
      theme: "광야의 사건들",
      pairs: [
        { left: "고라의 반역", right: "땅이 갈라져 삼킨 무리의 봉기" },
        { left: "놋뱀", right: "쳐다보면 사는 장대 위의 뱀" },
        { left: "발람", right: "이스라엘을 저주하려다 축복한 선지자" },
        { left: "발람의 나귀", right: "여호와의 사자를 보고 말한 짐승" },
      ],
      explanation: "광야 여정 중의 사건과 인물이다.",
      reference: "민수기 16:31-25:1",
    },
  ],
  3: [
    {
      theme: "사무엘과 사울",
      pairs: [
        { left: "한나", right: "기도로 사무엘을 얻은 어머니" },
        { left: "사무엘", right: "이스라엘 마지막 사사이자 선지자" },
        { left: "사울", right: "기름 부음 받은 이스라엘 초대 왕" },
      ],
      explanation: "왕정 초기의 핵심 인물들이다.",
      reference: "사무엘상 1:20-10:1",
    },
    {
      theme: "다윗의 등장",
      pairs: [
        { left: "이새", right: "베들레헴에 산 다윗의 아버지" },
        { left: "다윗", right: "양치던 중 기름 부음 받은 소년" },
        { left: "골리앗", right: "물맷돌에 쓰러진 블레셋 장수" },
        { left: "요나단", right: "다윗과 언약을 맺은 사울의 아들" },
      ],
      explanation: "다윗의 등장과 주변 인물들이다.",
      reference: "사무엘상 16:1-18:3",
    },
    {
      theme: "다윗의 도피",
      pairs: [
        { left: "아둘람 굴", right: "다윗이 도피해 무리를 모은 곳" },
        { left: "엔게디", right: "다윗이 사울을 살려준 굴이 있던 곳" },
        { left: "아비가일", right: "지혜로 다윗을 막은 나발의 아내" },
      ],
      explanation: "사울을 피해 다닌 다윗의 여정이다.",
      reference: "사무엘상 22:1-25:42",
    },
    {
      theme: "다윗의 통치",
      pairs: [
        { left: "헤브론", right: "다윗이 유다 왕으로 즉위한 곳" },
        { left: "예루살렘", right: "다윗이 정복해 수도로 삼은 성" },
        { left: "법궤 운반", right: "다윗이 춤추며 옮긴 일" },
        { left: "다윗 언약", right: "그 집과 나라가 영원하리라는 약속" },
      ],
      explanation: "다윗 왕국의 수립과 언약이다.",
      reference: "사무엘하 5:3-7:16",
    },
    {
      theme: "다윗의 범죄",
      pairs: [
        { left: "밧세바", right: "다윗이 범죄한 우리아의 아내" },
        { left: "우리아", right: "전쟁터에서 죽게 만든 충성된 군인" },
        { left: "나단", right: "다윗을 책망한 선지자" },
        { left: "솔로몬", right: "밧세바를 통해 태어난 후계자" },
      ],
      explanation: "다윗의 죄와 책망, 회복의 인물이다.",
      reference: "사무엘하 11:3-12:24",
    },
    {
      theme: "압살롬의 반역",
      pairs: [
        { left: "압살롬", right: "아버지를 대적해 반역한 다윗의 아들" },
        { left: "아히도벨", right: "압살롬 편에 선 다윗의 모사" },
        { left: "후새", right: "다윗을 위해 계략을 꺾은 친구" },
      ],
      explanation: "압살롬의 반역과 관련 인물들이다.",
      reference: "사무엘하 15:1-17:14",
    },
    {
      theme: "솔로몬의 지혜",
      pairs: [
        { left: "기브온", right: "솔로몬이 지혜를 구한 제단의 장소" },
        { left: "두 여인의 재판", right: "솔로몬의 지혜가 드러난 산 아이 판결" },
        { left: "스바 여왕", right: "솔로몬의 지혜를 보러 온 여왕" },
      ],
      explanation: "솔로몬의 지혜를 보여주는 사건들이다.",
      reference: "열왕기상 3:5-10:13",
    },
    {
      theme: "성전 건축",
      pairs: [
        { left: "솔로몬", right: "예루살렘 성전을 건축한 왕" },
        { left: "히람", right: "백향목과 기술자를 보낸 두로 왕" },
        { left: "지성소", right: "언약궤를 안치한 가장 거룩한 곳" },
        { left: "성전 봉헌", right: "구름이 가득 찬 봉헌 기도의 사건" },
      ],
      explanation: "솔로몬 성전 건축의 요소들이다.",
      reference: "열왕기상 6:1-8:11",
    },
    {
      theme: "솔로몬의 영광과 타락",
      pairs: [
        { left: "이방 아내들", right: "솔로몬의 마음을 돌이킨 여인들" },
        { left: "우상숭배", right: "솔로몬 말년에 빠진 죄" },
        { left: "나라의 분열 예고", right: "범죄에 대한 하나님의 심판 선언" },
      ],
      explanation: "솔로몬의 타락과 그 결과이다.",
      reference: "열왕기상 11:1-13",
    },
    {
      theme: "왕국 분열",
      pairs: [
        { left: "르호보암", right: "백성을 무겁게 한 솔로몬의 아들" },
        { left: "여로보암", right: "북이스라엘 열 지파의 왕이 된 자" },
        { left: "북이스라엘", right: "열 지파로 이루어진 나라" },
        { left: "남유다", right: "유다와 베냐민으로 남은 나라" },
      ],
      explanation: "왕국 분열의 인물과 결과이다.",
      reference: "열왕기상 12:1-20",
    },
  ],
  4: [
    {
      theme: "예수님의 탄생",
      pairs: [
        { left: "가브리엘", right: "마리아에게 수태를 알린 천사" },
        { left: "베들레헴", right: "예수님이 나신 마을" },
        { left: "목자들", right: "천사의 소식을 듣고 찾아온 자들" },
        { left: "동방박사", right: "별을 따라 경배하러 온 자들" },
      ],
      explanation: "예수님 탄생과 관련된 인물과 장소이다.",
      reference: "누가복음 1:26-2:16",
    },
    {
      theme: "예수님의 어린 시절",
      pairs: [
        { left: "시므온", right: "성전에서 아기 예수를 안고 찬송한 노인" },
        { left: "애굽 피신", right: "헤롯을 피해 떠난 일" },
        { left: "나사렛", right: "예수님이 자라신 마을" },
        { left: "열두 살 예수", right: "성전에서 학자들과 문답하신 사건" },
      ],
      explanation: "예수님의 유년기 사건들이다.",
      reference: "누가복음 2:25-49",
    },
    {
      theme: "세례와 시험",
      pairs: [
        { left: "세례 요한", right: "요단강에서 예수께 세례 준 자" },
        { left: "비둘기", right: "성령이 임한 모습" },
        { left: "광야 사십 일", right: "예수님이 금식하며 시험받은 기간" },
        { left: "마귀", right: "예수님을 세 번 시험한 자" },
      ],
      explanation: "공생애 시작의 세례와 시험이다.",
      reference: "마태복음 3:13-4:11",
    },
    {
      theme: "열두 제자",
      pairs: [
        { left: "베드로", right: "반석이라 불린 어부 출신 제자" },
        { left: "안드레", right: "베드로를 예수께 데려온 형제" },
        { left: "마태", right: "세관에서 부름받은 세리" },
        { left: "도마", right: "부활을 의심했던 제자" },
      ],
      explanation: "예수님이 부르신 제자들이다.",
      reference: "마태복음 10:2-4",
    },
    {
      theme: "산상수훈",
      pairs: [
        { left: "팔복", right: "복 있는 자를 선언한 가르침" },
        { left: "주기도문", right: "예수님이 가르치신 기도" },
        { left: "소금과 빛", right: "제자의 정체성을 비유한 말씀" },
      ],
      explanation: "산상수훈의 주요 가르침이다.",
      reference: "마태복음 5:3-6:13",
    },
    {
      theme: "변화산 사건",
      pairs: [
        { left: "변화산", right: "예수님의 모습이 변한 산" },
        { left: "모세와 엘리야", right: "예수님과 함께 나타난 두 사람" },
        { left: "베드로, 야고보, 요한", right: "그 자리에 있던 세 제자" },
      ],
      explanation: "변화산에서 일어난 일과 인물들이다.",
      reference: "마태복음 17:1-4",
    },
    {
      theme: "예루살렘 입성",
      pairs: [
        { left: "나귀 새끼", right: "예수님이 타고 입성하신 짐승" },
        { left: "호산나", right: "무리가 외친 환영의 소리" },
        { left: "성전 정화", right: "장사꾼을 내쫓으신 사건" },
      ],
      explanation: "고난주간 초입의 사건들이다.",
      reference: "마태복음 21:1-13",
    },
    {
      theme: "마지막 만찬",
      pairs: [
        { left: "떡", right: "예수님이 자기 몸이라 하신 것" },
        { left: "잔", right: "언약의 피라 하신 것" },
        { left: "가룟 유다", right: "예수님을 팔 자로 지목된 제자" },
        { left: "발 씻김", right: "제자들에게 본을 보이신 섬김" },
      ],
      explanation: "최후의 만찬에서 있었던 일들이다.",
      reference: "요한복음 13:5-26",
    },
    {
      theme: "십자가 사건",
      pairs: [
        { left: "겟세마네", right: "예수님이 피땀 흘려 기도한 동산" },
        { left: "빌라도", right: "예수께 사형을 언도한 총독" },
        { left: "골고다", right: "예수님이 못 박히신 곳" },
        { left: "구레네 시몬", right: "예수님의 십자가를 대신 진 자" },
      ],
      explanation: "예수님의 체포와 십자가 사건이다.",
      reference: "마태복음 26:36-27:33",
    },
    {
      theme: "부활과 승천",
      pairs: [
        { left: "빈 무덤", right: "안식 후 첫날 발견된 사건" },
        { left: "막달라 마리아", right: "부활하신 예수를 처음 본 여인" },
        { left: "엠마오", right: "두 제자가 부활하신 주를 만난 길" },
        { left: "감람산", right: "예수님이 승천하신 곳" },
      ],
      explanation: "부활과 승천의 장면들이다.",
      reference: "요한복음 20:1-18; 사도행전 1:9-12",
    },
  ],
  5: [
    {
      theme: "씨 뿌리는 비유의 땅",
      pairs: [
        { left: "길가", right: "새가 먹어버린 씨가 떨어진 곳" },
        { left: "돌밭", right: "흙이 얕아 곧 마른 씨가 떨어진 곳" },
        { left: "가시떨기", right: "기운을 막아 결실 못 한 씨가 떨어진 곳" },
        { left: "좋은 땅", right: "백 배 결실을 맺은 곳" },
      ],
      explanation: "씨 뿌리는 비유의 네 가지 땅이다.",
      reference: "마태복음 13:4-23",
    },
    {
      theme: "잃은 것의 비유",
      pairs: [
        { left: "잃은 양", right: "아흔아홉을 두고 찾아 나선 한 마리" },
        { left: "잃은 드라크마", right: "여인이 등불 켜고 찾은 은전" },
        { left: "탕자", right: "아버지께 돌아온 둘째 아들" },
      ],
      explanation: "잃은 자를 찾으시는 비유들이다.",
      reference: "누가복음 15:4-24",
    },
    {
      theme: "천국 비유",
      pairs: [
        { left: "겨자씨", right: "작으나 크게 자라는 나무 비유" },
        { left: "누룩", right: "가루 속에 퍼지는 비유" },
        { left: "감추인 보화", right: "밭에서 발견해 밭을 산 비유" },
        { left: "값진 진주", right: "모든 것을 팔아 산 진주 비유" },
      ],
      explanation: "천국을 묘사한 비유들이다.",
      reference: "마태복음 13:31-46",
    },
    {
      theme: "윤리적 비유",
      pairs: [
        { left: "선한 사마리아인", right: "강도 만난 자를 도운 이웃 비유" },
        { left: "용서할 줄 모르는 종", right: "큰 빚 탕감받고 작은 빚 못 봐준 비유" },
        { left: "달란트", right: "맡은 것을 활용해야 함을 가르친 비유" },
      ],
      explanation: "삶의 태도를 가르친 비유들이다.",
      reference: "누가복음 10:30-37; 마태복음 18:23-35; 25:14-30",
    },
    {
      theme: "자연을 다스린 기적",
      pairs: [
        { left: "풍랑을 잠잠케 하심", right: "바람과 바다를 꾸짖으신 기적" },
        { left: "물 위를 걸으심", right: "갈릴리 바다 위를 걸으신 기적" },
        { left: "물로 포도주", right: "가나 혼인 잔치의 첫 표적" },
      ],
      explanation: "자연을 주관하신 기적들이다.",
      reference: "마가복음 4:39; 6:48; 요한복음 2:9",
    },
    {
      theme: "먹이신 기적",
      pairs: [
        { left: "오병이어", right: "오천 명을 먹이신 떡과 물고기" },
        { left: "칠병이어", right: "사천 명을 먹이신 떡과 물고기" },
        { left: "그물 가득한 고기", right: "밤새 헛수고 후 잡은 큰 어획" },
      ],
      explanation: "양식을 공급하신 기적들이다.",
      reference: "마태복음 14:19-21; 15:34-38; 누가복음 5:6",
    },
    {
      theme: "병 고치신 기적",
      pairs: [
        { left: "나병환자", right: "손을 대어 깨끗하게 하신 자" },
        { left: "혈루증 여인", right: "옷자락을 만져 나은 여인" },
        { left: "베데스다 병자", right: "삼십팔 년 된 병에서 일어난 자" },
        { left: "맹인 바디매오", right: "여리고에서 보게 된 거지" },
      ],
      explanation: "예수님이 고치신 병자들이다.",
      reference: "마태복음 8:3; 9:20-22; 요한복음 5:5-9; 마가복음 10:46-52",
    },
    {
      theme: "죽은 자를 살리신 기적",
      pairs: [
        { left: "나사로", right: "나흘 만에 무덤에서 나온 자" },
        { left: "야이로의 딸", right: "달리다굼 말씀으로 살아난 소녀" },
        { left: "나인성 과부의 아들", right: "상여에서 일어난 청년" },
      ],
      explanation: "죽은 자를 살리신 기적들이다.",
      reference: "요한복음 11:43-44; 마가복음 5:41-42; 누가복음 7:14-15",
    },
    {
      theme: "귀신 축출 기적",
      pairs: [
        { left: "거라사의 광인", right: "군대 귀신이 돼지로 들어간 사건" },
        { left: "귀신 들린 아이", right: "제자들이 못 고친 간질 같은 아이" },
        { left: "가나안 여인의 딸", right: "어머니의 믿음으로 나은 아이" },
      ],
      explanation: "귀신을 쫓아내신 기적들이다.",
      reference: "마가복음 5:9-13; 9:25-27; 마태복음 15:28",
    },
    {
      theme: "기도와 청지기 비유",
      pairs: [
        { left: "바리새인과 세리", right: "겸손한 기도를 가르친 비유" },
        { left: "불의한 재판장", right: "끈질긴 기도를 가르친 과부 비유" },
        { left: "어리석은 부자", right: "재물을 쌓아두려던 자의 비유" },
        { left: "열 처녀", right: "준비를 가르친 신랑 맞이 비유" },
      ],
      explanation: "기도와 준비를 가르친 비유들이다.",
      reference: "누가복음 18:1-14; 12:16-21; 마태복음 25:1-13",
    },
  ],
  6: [
    {
      theme: "성령 강림",
      pairs: [
        { left: "오순절", right: "성령이 강림하신 날" },
        { left: "불의 혀", right: "각 사람 위에 임한 모습" },
        { left: "방언", right: "여러 나라 말로 말하게 된 현상" },
        { left: "베드로의 설교", right: "삼천 명이 회개한 첫 설교" },
      ],
      explanation: "오순절 성령 강림의 요소들이다.",
      reference: "사도행전 2:1-41",
    },
    {
      theme: "초대교회의 모습",
      pairs: [
        { left: "성전 미문", right: "베드로가 앉은뱅이를 고친 곳" },
        { left: "재산 통용", right: "믿는 자들이 함께 나눈 삶" },
        { left: "아나니아와 삽비라", right: "헌금을 속이다 죽은 부부" },
      ],
      explanation: "초대교회 공동체의 모습이다.",
      reference: "사도행전 3:2-5:10",
    },
    {
      theme: "일곱 집사",
      pairs: [
        { left: "일곱 집사", right: "구제를 맡기려 세운 봉사자들" },
        { left: "스데반", right: "첫 순교자가 된 집사" },
        { left: "빌립", right: "사마리아에서 복음 전한 집사" },
      ],
      explanation: "초대교회가 세운 일꾼들이다.",
      reference: "사도행전 6:5-8:5",
    },
    {
      theme: "스데반의 순교",
      pairs: [
        { left: "스데반", right: "돌에 맞아 순교한 증인" },
        { left: "공회", right: "스데반을 심문한 유대 의회" },
        { left: "사울", right: "스데반의 죽음을 마땅히 여긴 자" },
      ],
      explanation: "스데반 순교 사건의 인물들이다.",
      reference: "사도행전 6:12-8:1",
    },
    {
      theme: "복음의 확장",
      pairs: [
        { left: "에디오피아 내시", right: "빌립이 마차에서 전도한 사람" },
        { left: "고넬료", right: "베드로를 통해 복음 받은 백부장" },
        { left: "안디옥", right: "처음 그리스도인이라 불린 곳" },
      ],
      explanation: "이방인에게로 확장된 복음이다.",
      reference: "사도행전 8:27-11:26",
    },
    {
      theme: "사울의 회심",
      pairs: [
        { left: "다메섹 도상", right: "사울이 빛을 만난 길" },
        { left: "아나니아", right: "사울에게 안수해 눈을 뜨게 한 자" },
        { left: "바울", right: "회심한 사울의 사도 이름" },
      ],
      explanation: "사울의 회심 과정이다.",
      reference: "사도행전 9:3-22",
    },
    {
      theme: "바울의 동역자",
      pairs: [
        { left: "바나바", right: "바울을 천거하고 함께 사역한 자" },
        { left: "실라", right: "빌립보 옥에서 함께 찬송한 동역자" },
        { left: "디모데", right: "바울이 아들처럼 여긴 젊은 동역자" },
        { left: "누가", right: "사도행전을 기록한 의사 동역자" },
      ],
      explanation: "바울의 주요 동역자들이다.",
      reference: "사도행전 9:27-16:25",
    },
    {
      theme: "전도 여행의 도시",
      pairs: [
        { left: "빌립보", right: "루디아가 회심하고 옥에 갇힌 도시" },
        { left: "아덴", right: "바울이 알지 못하는 신을 전한 도시" },
        { left: "에베소", right: "바울이 오래 머물며 사역한 도시" },
        { left: "고린도", right: "아굴라와 브리스길라를 만난 도시" },
      ],
      explanation: "바울 전도 여행의 주요 도시들이다.",
      reference: "사도행전 16:14-19:10",
    },
    {
      theme: "예루살렘 공의회",
      pairs: [
        { left: "할례 논쟁", right: "이방인 구원 조건에 관한 다툼" },
        { left: "야고보", right: "공의회에서 결론을 내린 지도자" },
        { left: "결정 편지", right: "이방인에게 보낸 권면의 서신" },
      ],
      explanation: "예루살렘 공의회의 쟁점과 결정이다.",
      reference: "사도행전 15:1-29",
    },
    {
      theme: "바울의 로마행",
      pairs: [
        { left: "체포", right: "예루살렘 성전에서 일어난 일" },
        { left: "가이사에게 상소", right: "로마 시민권으로 한 요청" },
        { left: "풍랑과 파선", right: "멜리데 섬에 이른 항해의 시련" },
        { left: "로마", right: "바울이 갇혀서도 복음 전한 도성" },
      ],
      explanation: "바울이 로마에 이르는 여정이다.",
      reference: "사도행전 21:33-28:31",
    },
  ],
  7: [
    {
      theme: "호세아",
      pairs: [
        { left: "고멜", right: "호세아가 맞이한 음란한 아내" },
        { left: "이스르엘", right: "심판을 뜻하는 자녀의 이름" },
        { left: "로루하마", right: "긍휼을 받지 못함을 뜻하는 딸 이름" },
      ],
      explanation: "호세아서의 상징적 인물과 이름들이다.",
      reference: "호세아 1:3-9",
    },
    {
      theme: "요엘",
      pairs: [
        { left: "메뚜기 재앙", right: "땅을 황폐케 한 심판의 도구" },
        { left: "여호와의 날", right: "심판과 회복이 임할 날" },
        { left: "성령 부어주심", right: "모든 육체에 임할 약속" },
      ],
      explanation: "요엘서의 핵심 메시지들이다.",
      reference: "요엘 1:4-2:28",
    },
    {
      theme: "아모스",
      pairs: [
        { left: "드고아의 목자", right: "아모스의 본래 직업" },
        { left: "다림줄", right: "공의의 기준을 보인 환상" },
        { left: "여름 과일 광주리", right: "끝이 이르렀음을 보인 환상" },
      ],
      explanation: "아모스의 신분과 환상들이다.",
      reference: "아모스 1:1; 7:8; 8:2",
    },
    {
      theme: "오바댜",
      pairs: [
        { left: "에돔", right: "오바댜가 심판을 선포한 나라" },
        { left: "에서의 자손", right: "에돔 사람의 조상" },
        { left: "교만", right: "에돔이 멸망하는 이유" },
      ],
      explanation: "오바댜서의 대상과 심판 이유이다.",
      reference: "오바댜 1:1-4",
    },
    {
      theme: "요나",
      pairs: [
        { left: "다시스", right: "요나가 도망치려 한 방향의 항구" },
        { left: "큰 물고기", right: "요나를 삼킨 짐승" },
        { left: "니느웨", right: "요나가 회개를 전한 성읍" },
        { left: "박넝쿨", right: "요나에게 그늘을 주었다 시든 식물" },
      ],
      explanation: "요나서의 주요 사건과 사물이다.",
      reference: "요나 1:3-4:7",
    },
    {
      theme: "미가",
      pairs: [
        { left: "베들레헴", right: "통치자가 나올 것이라 예언된 곳" },
        { left: "공의와 인자", right: "여호와께서 구하시는 것" },
        { left: "칼을 쳐서 보습", right: "평화의 시대를 묘사한 표현" },
      ],
      explanation: "미가서의 대표적 예언들이다.",
      reference: "미가 4:3; 5:2; 6:8",
    },
    {
      theme: "나훔",
      pairs: [
        { left: "니느웨", right: "나훔이 멸망을 선포한 성" },
        { left: "앗수르", right: "심판받는 제국" },
        { left: "여호와의 보복", right: "원수에게 임하는 진노" },
      ],
      explanation: "나훔서의 심판 대상과 주제이다.",
      reference: "나훔 1:1-2",
    },
    {
      theme: "하박국",
      pairs: [
        { left: "갈대아 사람", right: "심판의 도구로 쓰인 바벨론" },
        { left: "의인은 믿음으로", right: "하박국이 받은 핵심 응답" },
        { left: "파수대", right: "선지자가 응답을 기다린 자리" },
      ],
      explanation: "하박국서의 질문과 응답이다.",
      reference: "하박국 1:6; 2:1-4",
    },
    {
      theme: "스가랴",
      pairs: [
        { left: "여덟 환상", right: "스가랴가 본 밤의 환상들" },
        { left: "순금 등잔대", right: "성령으로 됨을 보인 환상" },
        { left: "겸손한 왕", right: "나귀 타고 오는 왕의 예언" },
      ],
      explanation: "스가랴서의 환상과 예언이다.",
      reference: "스가랴 1:8-9:9",
    },
    {
      theme: "말라기",
      pairs: [
        { left: "십일조", right: "도둑질하지 말라 책망받은 항목" },
        { left: "흠 있는 제물", right: "제사장이 책망받은 잘못" },
        { left: "엘리야", right: "여호와의 날 전에 보내실 자" },
      ],
      explanation: "말라기서의 책망과 약속이다.",
      reference: "말라기 1:8; 3:8; 4:5",
    },
  ],
  8: [
    {
      theme: "여호수아",
      pairs: [
        { left: "여리고", right: "성벽이 무너진 첫 정복 성읍" },
        { left: "라합", right: "정탐꾼을 숨겨준 여리고 여인" },
        { left: "아이성", right: "아간의 범죄로 패배한 성읍" },
        { left: "기브온", right: "속임수로 화친을 맺은 족속" },
      ],
      explanation: "여호수아의 가나안 정복 사건들이다.",
      reference: "여호수아 2:1-9:15",
    },
    {
      theme: "사사 시대 인물",
      pairs: [
        { left: "옷니엘", right: "이스라엘의 첫 사사" },
        { left: "에훗", right: "왼손잡이로 모압 왕을 죽인 사사" },
        { left: "드보라", right: "여선지자이자 사사" },
        { left: "기드온", right: "삼백 명으로 미디안을 친 사사" },
      ],
      explanation: "사사기의 주요 사사들이다.",
      reference: "사사기 3:9-7:7",
    },
    {
      theme: "삼손",
      pairs: [
        { left: "나실인", right: "삼손이 태어날 때 받은 서원" },
        { left: "들릴라", right: "삼손의 힘의 비밀을 캐낸 여인" },
        { left: "머리털", right: "삼손의 힘이 있던 곳" },
        { left: "다곤 신전", right: "삼손이 무너뜨린 블레셋의 신전" },
      ],
      explanation: "삼손의 생애와 관련된 요소들이다.",
      reference: "사사기 13:5-16:30",
    },
    {
      theme: "룻기",
      pairs: [
        { left: "나오미", right: "모압에서 두 며느리를 둔 여인" },
        { left: "룻", right: "시어머니를 따라온 모압 여인" },
        { left: "보아스", right: "룻을 아내로 맞은 기업 무를 자" },
        { left: "오벳", right: "룻이 낳은 다윗의 조부" },
      ],
      explanation: "룻기의 인물과 관계이다.",
      reference: "룻기 1:4-4:21",
    },
    {
      theme: "엘리야",
      pairs: [
        { left: "그릿 시냇가", right: "까마귀가 엘리야를 먹인 곳" },
        { left: "갈멜산", right: "바알 선지자와 대결한 산" },
        { left: "세미한 소리", right: "호렙산에서 하나님을 만난 방식" },
        { left: "불수레", right: "엘리야가 하늘로 올라간 방식" },
      ],
      explanation: "엘리야의 주요 사건들이다.",
      reference: "열왕기상 17:6-열왕기하 2:11",
    },
    {
      theme: "엘리사",
      pairs: [
        { left: "갑절의 영감", right: "엘리사가 엘리야에게 구한 것" },
        { left: "나아만", right: "요단강에서 나병이 나은 아람 장군" },
        { left: "수넴 여인", right: "엘리사가 아들을 살려준 가정" },
        { left: "도끼", right: "물에 빠졌다 떠오른 쇠" },
      ],
      explanation: "엘리사의 기적과 인물들이다.",
      reference: "열왕기하 2:9-6:6",
    },
    {
      theme: "유다의 선한 왕",
      pairs: [
        { left: "히스기야", right: "산헤립을 물리치고 성전을 정결케 한 왕" },
        { left: "요시야", right: "율법책을 발견하고 개혁한 왕" },
        { left: "여호사밧", right: "찬양대를 앞세워 승리한 왕" },
      ],
      explanation: "유다의 개혁을 이끈 선한 왕들이다.",
      reference: "열왕기하 18:13-22:13; 역대하 20:21",
    },
    {
      theme: "포로와 멸망",
      pairs: [
        { left: "북이스라엘 멸망", right: "앗수르에 의한 사마리아 함락" },
        { left: "예루살렘 함락", right: "바벨론에 의한 성전 파괴" },
        { left: "느부갓네살", right: "유다를 사로잡아간 바벨론 왕" },
        { left: "시드기야", right: "눈이 뽑힌 유다의 마지막 왕" },
      ],
      explanation: "남북 왕국 멸망의 사건들이다.",
      reference: "열왕기하 17:6-25:7",
    },
    {
      theme: "포로 귀환",
      pairs: [
        { left: "고레스", right: "귀환을 허락한 바사 왕" },
        { left: "스룹바벨", right: "성전 재건을 이끈 지도자" },
        { left: "에스라", right: "율법을 가르친 학사 겸 제사장" },
        { left: "느헤미야", right: "예루살렘 성벽을 재건한 총독" },
      ],
      explanation: "포로 귀환과 재건의 지도자들이다.",
      reference: "에스라 1:2-느헤미야 6:15",
    },
    {
      theme: "에스더",
      pairs: [
        { left: "아하수에로", right: "에스더를 왕후로 삼은 바사 왕" },
        { left: "모르드개", right: "에스더를 기른 사촌" },
        { left: "하만", right: "유대인을 멸하려다 처형된 자" },
        { left: "부림절", right: "유대인의 구원을 기념하는 절기" },
      ],
      explanation: "에스더서의 인물과 절기이다.",
      reference: "에스더 2:7-9:26",
    },
  ],
  9: [
    {
      theme: "로마서",
      pairs: [
        { left: "이신칭의", right: "믿음으로 의롭게 됨" },
        { left: "아담과 그리스도", right: "한 사람으로 죄와 의가 임한 대조" },
        { left: "산 제물", right: "몸을 드리는 합당한 예배" },
      ],
      explanation: "로마서의 핵심 교리들이다.",
      reference: "로마서 5:18-12:1",
    },
    {
      theme: "고린도전서",
      pairs: [
        { left: "사랑장", right: "사랑이 제일임을 노래한 13장" },
        { left: "은사", right: "한 성령이 나누어 주시는 직분들" },
        { left: "부활", right: "첫 열매이신 그리스도의 핵심 교리" },
      ],
      explanation: "고린도전서의 주요 주제들이다.",
      reference: "고린도전서 12:4-15:23",
    },
    {
      theme: "고린도후서",
      pairs: [
        { left: "질그릇", right: "보배를 담은 연약한 우리의 비유" },
        { left: "새로운 피조물", right: "그리스도 안에서의 변화" },
        { left: "육체의 가시", right: "바울이 자랑하지 않게 한 고난" },
      ],
      explanation: "고린도후서의 대표적 표현들이다.",
      reference: "고린도후서 4:7-12:7",
    },
    {
      theme: "갈라디아서",
      pairs: [
        { left: "성령의 열매", right: "사랑과 희락과 화평 등의 아홉 가지" },
        { left: "율법과 자유", right: "그리스도께서 주신 해방" },
        { left: "십자가에 못 박힘", right: "내가 그리스도와 함께 된 일" },
      ],
      explanation: "갈라디아서의 핵심 가르침이다.",
      reference: "갈라디아서 2:20-5:23",
    },
    {
      theme: "에베소서",
      pairs: [
        { left: "은혜로 구원", right: "행위가 아닌 믿음으로 받음" },
        { left: "하나님의 전신 갑주", right: "영적 싸움을 위한 무장" },
        { left: "교회는 몸", right: "그리스도가 머리이신 비유" },
      ],
      explanation: "에베소서의 대표 가르침이다.",
      reference: "에베소서 2:8-6:17",
    },
    {
      theme: "빌립보서",
      pairs: [
        { left: "겸손의 본", right: "자기를 비우신 그리스도" },
        { left: "항상 기뻐하라", right: "옥중에서 거듭 권한 명령" },
        { left: "푯대를 향하여", right: "상을 위해 달려가는 자세" },
      ],
      explanation: "빌립보서의 권면들이다.",
      reference: "빌립보서 2:7-4:4",
    },
    {
      theme: "목회 서신",
      pairs: [
        { left: "디모데전서", right: "감독과 집사의 자격을 다룬 서신" },
        { left: "디모데후서", right: "선한 싸움을 다 싸웠다는 마지막 서신" },
        { left: "디도서", right: "그레데 교회 질서를 다룬 서신" },
      ],
      explanation: "바울의 목회 서신들이다.",
      reference: "디모데전서 3:1-디도서 1:5",
    },
    {
      theme: "히브리서",
      pairs: [
        { left: "멜기세덱", right: "그리스도의 영원한 제사장직의 모형" },
        { left: "믿음장", right: "믿음의 사람들을 열거한 11장" },
        { left: "단번에 드린 제사", right: "그리스도의 완전한 속죄" },
      ],
      explanation: "히브리서의 핵심 주제들이다.",
      reference: "히브리서 7:17-11:40",
    },
    {
      theme: "야고보서와 베드로서",
      pairs: [
        { left: "행함이 있는 믿음", right: "야고보서가 강조한 믿음" },
        { left: "혀의 제어", right: "야고보서가 다룬 말의 문제" },
        { left: "산 소망", right: "베드로전서가 말한 부활의 소망" },
        { left: "왕 같은 제사장", right: "베드로전서가 말한 성도의 신분" },
      ],
      explanation: "공동 서신의 핵심 가르침이다.",
      reference: "야고보서 2:17-3:8; 베드로전서 1:3-2:9",
    },
    {
      theme: "요한 서신",
      pairs: [
        { left: "하나님은 사랑", right: "요한일서의 핵심 선언" },
        { left: "빛 가운데 행함", right: "교제의 조건으로 제시된 삶" },
        { left: "진리 안에서 행함", right: "요한이 기뻐한 자녀들의 모습" },
      ],
      explanation: "요한 서신의 핵심 주제들이다.",
      reference: "요한일서 1:7-4:8; 요한이서 1:4",
    },
  ],
  10: [
    {
      theme: "요한계시록 서론",
      pairs: [
        { left: "밧모섬", right: "요한이 계시를 받은 유배지" },
        { left: "알파와 오메가", right: "처음과 마지막이신 주의 칭호" },
        { left: "인자 같은 이", right: "촛대 사이에 거니신 영광의 주" },
      ],
      explanation: "계시록 서두의 환상과 장소이다.",
      reference: "요한계시록 1:9-18",
    },
    {
      theme: "일곱 교회",
      pairs: [
        { left: "에베소 교회", right: "처음 사랑을 버렸다 책망받은 교회" },
        { left: "서머나 교회", right: "환난 중에도 칭찬만 받은 교회" },
        { left: "버가모 교회", right: "사탄의 권좌가 있는 곳의 교회" },
        { left: "라오디게아 교회", right: "차지도 덥지도 않다 책망받은 교회" },
      ],
      explanation: "계시록의 일곱 교회 중 일부이다.",
      reference: "요한계시록 2:4-3:16",
    },
    {
      theme: "하늘 보좌 환상",
      pairs: [
        { left: "보좌", right: "벽옥과 홍보석 같은 이가 앉으신 자리" },
        { left: "이십사 장로", right: "흰옷 입고 금관을 쓴 보좌 둘레의 자들" },
        { left: "네 생물", right: "사자, 송아지, 사람, 독수리 모양의 존재" },
      ],
      explanation: "하늘 보좌 주위의 환상이다.",
      reference: "요한계시록 4:3-7",
    },
    {
      theme: "어린 양과 두루마리",
      pairs: [
        { left: "일곱 인의 두루마리", right: "아무도 펴지 못하던 책" },
        { left: "어린 양", right: "일찍이 죽임 당한 듯한 합당한 자" },
        { left: "새 노래", right: "어린 양을 찬양한 노래" },
      ],
      explanation: "두루마리를 여시는 어린 양 환상이다.",
      reference: "요한계시록 5:1-9",
    },
    {
      theme: "일곱 인",
      pairs: [
        { left: "흰 말", right: "이기려고 나아가는 첫째 인의 말" },
        { left: "붉은 말", right: "화평을 거두는 둘째 인의 말" },
        { left: "검은 말", right: "저울을 든 셋째 인의 말" },
        { left: "청황색 말", right: "사망이 탄 넷째 인의 말" },
      ],
      explanation: "일곱 인 중 네 말의 환상이다.",
      reference: "요한계시록 6:2-8",
    },
    {
      theme: "일곱 나팔",
      pairs: [
        { left: "첫째 나팔", right: "땅의 삼분의 일이 타버림" },
        { left: "둘째 나팔", right: "바다 삼분의 일이 피가 됨" },
        { left: "다섯째 나팔", right: "무저갱에서 황충이 올라옴" },
      ],
      explanation: "일곱 나팔 심판 중 일부이다.",
      reference: "요한계시록 8:7-9:3",
    },
    {
      theme: "여자와 용",
      pairs: [
        { left: "해를 입은 여자", right: "남자아이를 낳은 환상 속 여인" },
        { left: "붉은 용", right: "아이를 삼키려 한 큰 용" },
        { left: "미가엘", right: "용과 싸워 이긴 천사장" },
      ],
      explanation: "여자와 용의 영적 전쟁 환상이다.",
      reference: "요한계시록 12:1-9",
    },
    {
      theme: "두 짐승",
      pairs: [
        { left: "바다에서 나온 짐승", right: "용의 권세를 받은 열 뿔 짐승" },
        { left: "땅에서 나온 짐승", right: "어린 양 같으나 용처럼 말하는 짐승" },
        { left: "육백육십육", right: "짐승의 수로 제시된 숫자" },
      ],
      explanation: "계시록 두 짐승의 환상이다.",
      reference: "요한계시록 13:1-18",
    },
    {
      theme: "심판과 멸망",
      pairs: [
        { left: "큰 바벨론", right: "무너진 음녀의 성" },
        { left: "아마겟돈", right: "마지막 전쟁이 모이는 곳" },
        { left: "백 보좌 심판", right: "죽은 자가 행위대로 심판받는 자리" },
        { left: "불못", right: "사망과 음부가 던져진 둘째 사망" },
      ],
      explanation: "마지막 심판과 멸망의 환상들이다.",
      reference: "요한계시록 16:16-20:15",
    },
    {
      theme: "새 하늘과 새 땅",
      pairs: [
        { left: "새 예루살렘", right: "신부처럼 단장하여 내려온 거룩한 성" },
        { left: "생명수의 강", right: "보좌로부터 흘러나오는 강" },
        { left: "생명나무", right: "달마다 열매 맺는 치료의 나무" },
        { left: "눈물을 닦아 주심", right: "다시 사망이 없는 위로의 약속" },
      ],
      explanation: "새 하늘과 새 땅의 환상이다.",
      reference: "요한계시록 21:2-22:4",
    },
  ],
};

export const matchingQuestions: MatchingQuestion[] = Object.entries(levelData).flatMap(([level, items]) =>
  items.map((item, index) => {
    const rights = item.pairs.map((pair) => pair.right);
    const rotated = rotate(rights, (index % (item.pairs.length - 1)) + 1);
    return {
      id: questionId(Number(level), "match", index),
      level: Number(level),
      type: "matching",
      category: item.theme,
      difficulty: getDifficulty(Number(level)),
      question: "각 인물 또는 사건을 올바른 설명과 연결하세요.",
      payload: { pairs: item.pairs.map((pair, i) => ({ left: pair.left, right: rotated[i] })) },
      answer: { pairs: item.pairs },
      explanation: item.explanation,
      reference: item.reference,
    };
  }),
);
