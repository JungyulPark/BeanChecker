/**
 * 개발용 목데이터 — 프로덕션 시딩 아님.
 * 정식 시딩은 영업 여부 전수 확인 + 공식 채널 출처 기록 후 별도 진행 (LAUNCH_CHECKLIST Week 1).
 * 좌표는 개발 편의용 근사값이며 서버로 전송되지 않는다.
 */

export type MockCafe = {
  id: string;
  name: string;
  district: string;
  districtKo: string;
  address: string;
  isRoastery: boolean;
  lat: number;
  lng: number;
};

export type MockBean = {
  id: string;
  name: string;
  normalizedName: string;
  roasterId: string | null;
  roasterName: string | null;
  origin: string;
  originKo: string;
  process: "washed" | "natural" | "honey" | "anaerobic" | "other" | null;
};

export const MOCK_CAFES: MockCafe[] = [
  { id: "cafe-center", name: "센터커피 서울숲점", district: "seongsu", districtKo: "성수", address: "서울 성동구 서울숲2길", isRoastery: true, lat: 37.5467, lng: 127.0432 },
  { id: "cafe-lowkey", name: "로우키", district: "seongsu", districtKo: "성수", address: "서울 성동구 연무장길", isRoastery: true, lat: 37.5421, lng: 127.0559 },
  { id: "cafe-mesh", name: "메쉬커피", district: "seongsu", districtKo: "성수", address: "서울 성동구 성수이로", isRoastery: true, lat: 37.5442, lng: 127.0517 },
  { id: "cafe-anthracite", name: "앤트러사이트 한남", district: "hannam", districtKo: "한남", address: "서울 용산구 이태원로", isRoastery: true, lat: 37.5347, lng: 127.0016 },
  { id: "cafe-dbl", name: "딥블루레이크 연남", district: "yeonnam", districtKo: "연남", address: "서울 마포구 성미산로", isRoastery: true, lat: 37.5626, lng: 126.9256 },
  { id: "cafe-libre", name: "커피리브레 연남", district: "yeonnam", districtKo: "연남", address: "서울 마포구 동교로", isRoastery: true, lat: 37.5604, lng: 126.9243 },
  { id: "cafe-terre", name: "떼르드카페", district: "yangjae", districtKo: "양재", address: "서울 서초구 강남대로", isRoastery: true, lat: 37.4837, lng: 127.0355 },
];

export const MOCK_BEANS: MockBean[] = [
  { id: "bean-chelbesa", name: "에티오피아 워르카 첼베사", normalizedName: "에티오피아워르카첼베사", roasterId: "cafe-libre", roasterName: "커피리브레", origin: "ethiopia", originKo: "에티오피아", process: "washed" },
  { id: "bean-gesha", name: "파나마 게이샤 에스메랄다", normalizedName: "파나마게이샤에스메랄다", roasterId: "cafe-center", roasterName: "센터커피", origin: "panama", originKo: "파나마", process: "washed" },
  { id: "bean-huila", name: "콜롬비아 우일라 수프리모", normalizedName: "콜롬비아우일라수프리모", roasterId: "cafe-mesh", roasterName: "메쉬커피", origin: "colombia", originKo: "콜롬비아", process: "washed" },
  { id: "bean-yirg", name: "에티오피아 예가체프 G1", normalizedName: "에티오피아예가체프g1", roasterId: "cafe-dbl", roasterName: "딥블루레이크", origin: "ethiopia", originKo: "에티오피아", process: "natural" },
  { id: "bean-kenya", name: "케냐 니에리 AA", normalizedName: "케냐니에리aa", roasterId: "cafe-anthracite", roasterName: "앤트러사이트", origin: "kenya", originKo: "케냐", process: "washed" },
];
