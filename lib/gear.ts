/**
 * 홈브루 장비 추천 — 쿠팡 파트너스 어필리에이트 (Phase 3 수익 동선).
 *
 * ⚠️ 법적 요건 (공정위 표시광고법 심사지침):
 * - 어필리에이트 링크가 하나라도 노출되면 GearSection이 대가성 고지 문구를 상시 표시한다
 * - 쿠팡 파트너스 약관상 링크는 파트너스 대시보드에서 생성한 단축링크(link.coupang.com)만 사용
 *
 * 운영 방법: 쿠팡 파트너스 가입·승인 후, 대시보드에서 아래 각 상품의 링크를 생성해
 * url에 붙여넣는다. url이 null인 항목은 렌더되지 않고, 전부 null이면 섹션 자체가 숨는다 —
 * 승인 전까지 법적 리스크 0. 상품 선정은 홈브루 입문~중급 표준 장비 기준(@coffee_expert 감수 대상).
 */
export type GearItem = {
  id: string;
  name: string;
  category: string;
  note: string; // 왜 이 장비인가 — 한 줄
  url: string | null; // 쿠팡 파트너스 단축링크 (null = 비노출)
};

export const GEAR_ITEMS: GearItem[] = [
  {
    id: "dripper-v60",
    name: "하리오 V60 드리퍼",
    category: "드리퍼",
    note: "필터 커피 입문 표준 — 체크인 '필터'의 대부분이 이걸로 내려진다",
    url: null,
  },
  {
    id: "grinder-timemore",
    name: "타임모어 C2/C3 핸드그라인더",
    category: "그라인더",
    note: "갓 간 원두와 사놓은 분쇄커피의 차이가 취향 데이터의 절반",
    url: null,
  },
  {
    id: "scale",
    name: "드립 저울 (타이머 내장)",
    category: "저울",
    note: "레시피 재현의 시작 — 1:15~1:17 비율을 눈대중에서 데이터로",
    url: null,
  },
  {
    id: "kettle",
    name: "구즈넥 드립 케틀",
    category: "케틀",
    note: "물줄기 제어가 되면 같은 원두도 다르게 나온다",
    url: null,
  },
  {
    id: "filter",
    name: "V60 전용 필터 (02, 100매)",
    category: "소모품",
    note: "홈브루 체크인이 쌓이는 속도만큼 사라지는 것",
    url: null,
  },
  {
    id: "server",
    name: "커피 서버 600ml",
    category: "서버",
    note: "추출량이 보여야 농도가 잡힌다",
    url: null,
  },
];

export const GEAR_DISCLOSURE =
  "이 섹션은 쿠팡 파트너스 활동의 일환으로, 링크를 통해 구매 시 판매자로부터 일정액의 수수료를 제공받습니다. 구매자에게 추가 비용은 없습니다.";
