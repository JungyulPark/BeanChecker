import type { FlavorProfile } from "@/types/domain";
import type { FlavorTagId } from "@/lib/flavorTags";

/**
 * 개발용 목데이터 — 프로덕션 시딩 아님.
 * 정식 시딩은 영업 여부 전수 확인 + 공식 채널 출처 기록 후 별도 진행 (LAUNCH_CHECKLIST Week 1).
 * 좌표는 개발 편의용 근사값이며 서버로 전송되지 않는다.
 * avgRating/checkinCount는 pg_cron 집계 배치가 실제로 계산할 값의 자리표시자 —
 * 5건 룰(TECHNICAL_SPEC §3 평점 노출 정책)을 발견 페이지에서 시연하기 위해 일부러 미달 케이스도 섞었다.
 */

export type MockCafe = {
  id: string;
  name: string;
  slug: string;
  district: string;
  districtKo: string;
  address: string;
  isRoastery: boolean;
  lat: number;
  lng: number;
  avgRating: number | null; // null = 5건 미달
  checkinCount: number;
};

export type MockBean = {
  id: string;
  name: string;
  slug: string;
  normalizedName: string;
  roasterId: string | null;
  roasterName: string | null;
  origin: string;
  originKo: string;
  region: string;
  process: "washed" | "natural" | "honey" | "anaerobic" | "other" | null;
  roastLevel: number;
  officialNotes: string[];
  avgRating: number | null;
  checkinCount: number;
  avgProfile: FlavorProfile | null; // null = 5건 미달
  topFlavorTags: FlavorTagId[];
};

export const MOCK_CAFES: MockCafe[] = [
  { id: "cafe-center", name: "센터커피 서울숲점", slug: "center-coffee-seoul-forest", district: "seongsu", districtKo: "성수", address: "서울 성동구 서울숲2길", isRoastery: true, lat: 37.5467, lng: 127.0432, avgRating: 4.6, checkinCount: 128 },
  { id: "cafe-lowkey", name: "로우키", slug: "lowkey", district: "seongsu", districtKo: "성수", address: "서울 성동구 연무장길", isRoastery: true, lat: 37.5421, lng: 127.0559, avgRating: null, checkinCount: 3 },
  { id: "cafe-mesh", name: "메쉬커피", slug: "mesh-coffee", district: "seongsu", districtKo: "성수", address: "서울 성동구 성수이로", isRoastery: true, lat: 37.5442, lng: 127.0517, avgRating: 4.3, checkinCount: 61 },
  { id: "cafe-anthracite", name: "앤트러사이트 한남", slug: "anthracite-hannam", district: "hannam", districtKo: "한남", address: "서울 용산구 이태원로", isRoastery: true, lat: 37.5347, lng: 127.0016, avgRating: 4.5, checkinCount: 214 },
  { id: "cafe-dbl", name: "딥블루레이크 연남", slug: "deep-blue-lake", district: "yeonnam", districtKo: "연남", address: "서울 마포구 성미산로", isRoastery: true, lat: 37.5626, lng: 126.9256, avgRating: 4.7, checkinCount: 89 },
  { id: "cafe-libre", name: "커피리브레 연남", slug: "coffee-libre", district: "yeonnam", districtKo: "연남", address: "서울 마포구 동교로", isRoastery: true, lat: 37.5604, lng: 126.9243, avgRating: 4.8, checkinCount: 302 },
  { id: "cafe-terre", name: "떼르드카페", slug: "terre-de-cafe", district: "yangjae", districtKo: "양재", address: "서울 서초구 강남대로", isRoastery: true, lat: 37.4837, lng: 127.0355, avgRating: null, checkinCount: 2 },
];

export const MOCK_BEANS: MockBean[] = [
  {
    id: "bean-chelbesa", name: "에티오피아 워르카 첼베사", slug: "worka-chelbesa",
    normalizedName: "에티오피아워르카첼베사", roasterId: "cafe-libre", roasterName: "커피리브레",
    origin: "ethiopia", originKo: "에티오피아", region: "구지 워르카", process: "washed", roastLevel: 2,
    officialNotes: ["자스민", "복숭아", "홍차"],
    avgRating: 4.6, checkinCount: 47,
    avgProfile: { acidity: 8, sweetness: 7, body: 4, bitterness: 2, aftertaste: 7 },
    topFlavorTags: ["berry", "floral", "black-tea"],
  },
  {
    id: "bean-gesha", name: "파나마 게이샤 에스메랄다", slug: "gesha-esmeralda",
    normalizedName: "파나마게이샤에스메랄다", roasterId: "cafe-center", roasterName: "센터커피",
    origin: "panama", originKo: "파나마", region: "보케테", process: "washed", roastLevel: 2,
    officialNotes: ["자스민", "베르가못", "복숭아"],
    avgRating: 4.9, checkinCount: 22,
    avgProfile: { acidity: 9, sweetness: 8, body: 3, bitterness: 1, aftertaste: 8 },
    topFlavorTags: ["floral", "stone-fruit", "black-tea"],
  },
  {
    id: "bean-huila", name: "콜롬비아 우일라 수프리모", slug: "huila-supremo",
    normalizedName: "콜롬비아우일라수프리모", roasterId: "cafe-mesh", roasterName: "메쉬커피",
    origin: "colombia", originKo: "콜롬비아", region: "우일라", process: "washed", roastLevel: 3,
    officialNotes: ["초콜릿", "캐러멜", "오렌지"],
    avgRating: 4.2, checkinCount: 58,
    avgProfile: { acidity: 4, sweetness: 7, body: 8, bitterness: 5, aftertaste: 6 },
    topFlavorTags: ["chocolate", "caramel", "nutty"],
  },
  {
    id: "bean-yirg", name: "에티오피아 예가체프 G1", slug: "yirgacheffe-g1",
    normalizedName: "에티오피아예가체프g1", roasterId: "cafe-dbl", roasterName: "딥블루레이크",
    origin: "ethiopia", originKo: "에티오피아", region: "예가체프", process: "natural", roastLevel: 2,
    officialNotes: ["딸기", "와인", "꿀"],
    avgRating: 4.7, checkinCount: 91,
    avgProfile: { acidity: 7, sweetness: 8, body: 5, bitterness: 2, aftertaste: 7 },
    topFlavorTags: ["berry", "winey", "honey"],
  },
  {
    id: "bean-kenya", name: "케냐 니에리 AA", slug: "nyeri-aa",
    normalizedName: "케냐니에리aa", roasterId: "cafe-anthracite", roasterName: "앤트러사이트",
    origin: "kenya", originKo: "케냐", region: "니에리", process: "washed", roastLevel: 3,
    officialNotes: ["블랙커런트", "자몽", "와이니"],
    avgRating: null, checkinCount: 4,
    avgProfile: null,
    topFlavorTags: ["citrus", "winey"],
  },
];

export function findCafe(district: string, slug: string) {
  return MOCK_CAFES.find((c) => c.district === district && c.slug === slug) ?? null;
}

export function findBean(origin: string, slug: string) {
  return MOCK_BEANS.find((b) => b.origin === origin && b.slug === slug) ?? null;
}

export function beansByRoaster(roasterId: string) {
  return MOCK_BEANS.filter((b) => b.roasterId === roasterId);
}

export function beansByFlavorTag(tag: FlavorTagId) {
  return MOCK_BEANS.filter((b) => b.topFlavorTags.includes(tag));
}

export function cafesByDistrict(district: string) {
  return MOCK_CAFES.filter((c) => c.district === district);
}

export const DISTRICTS = [...new Set(MOCK_CAFES.map((c) => c.district))].map((id) => ({
  id,
  ko: MOCK_CAFES.find((c) => c.district === id)!.districtKo,
}));
