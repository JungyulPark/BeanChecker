import type { FlavorProfile } from "@/types/domain";
import type { FlavorTagId } from "@/lib/flavorTags";
import { SEED_CAFES, SEED_BEANS } from "./seed.generated";

/**
 * 개발용 시드 데이터 — Supabase 연결 전 스탑갭.
 * 카페·원두 본체는 launch/*.csv → scripts/generate-seed.mjs 로 생성 (seed.generated.ts, 직접 수정 금지).
 * 5건 룰(TECHNICAL_SPEC §3): 실데이터 신규 항목은 전부 avgRating null — 집계는 실제 체크인이 쌓여야 열린다.
 * 여기 남긴 DEMO_BEANS 5종은 레이더 차트·향미 페이지 시연용 자리표시자 (Supabase 집계 배치 연결 시 소멸).
 */

export type MockCafe = {
  id: string;
  name: string;
  slug: string;
  district: string;
  districtKo: string;
  address: string;
  isRoastery: boolean;
  lat: number; // 지역 중심 근사값 — 실좌표는 카카오맵 지오코딩으로 해석
  lng: number;
  avgRating: number | null; // null = 5건 미달
  checkinCount: number;
  websiteUrl: string | null; // 카페 공식 채널 (공식 도메인·인스타만 — 기사 출처 비노출)
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
  roastLevel: number | null; // null = 로스터 미공개
  officialNotes: string[];
  avgRating: number | null;
  checkinCount: number;
  avgProfile: FlavorProfile | null; // null = 5건 미달
  topFlavorTags: FlavorTagId[];
  purchaseUrl: string | null; // 로스터 공식몰 구매 링크 — Phase 3 어필리에이트·파트너십의 선행 동선
};

const DEMO_BEANS: MockBean[] = [
  {
    id: "bean-chelbesa", name: "에티오피아 워르카 첼베사", slug: "worka-chelbesa",
    normalizedName: "에티오피아워르카첼베사",
    roasterId: "cafe-yeonnam-coffee-libre", roasterName: "커피리브레 연남",
    origin: "ethiopia", originKo: "에티오피아", region: "구지 워르카", process: "washed", roastLevel: 2,
    officialNotes: ["자스민", "복숭아", "홍차"],
    avgRating: 4.6, checkinCount: 47,
    avgProfile: { acidity: 8, sweetness: 7, body: 4, bitterness: 2, aftertaste: 7 },
    topFlavorTags: ["berry", "floral", "black-tea"],
    purchaseUrl: null,
  },
  {
    id: "bean-gesha", name: "파나마 게이샤 에스메랄다", slug: "gesha-esmeralda",
    normalizedName: "파나마게이샤에스메랄다",
    roasterId: "cafe-seongsu-center-coffee", roasterName: "센터커피 서울숲점",
    origin: "panama", originKo: "파나마", region: "보케테", process: "washed", roastLevel: 2,
    officialNotes: ["자스민", "베르가못", "복숭아"],
    avgRating: 4.9, checkinCount: 22,
    avgProfile: { acidity: 9, sweetness: 8, body: 3, bitterness: 1, aftertaste: 8 },
    topFlavorTags: ["floral", "stone-fruit", "black-tea"],
    purchaseUrl: null,
  },
  {
    id: "bean-huila", name: "콜롬비아 우일라 수프리모", slug: "huila-supremo",
    normalizedName: "콜롬비아우일라수프리모",
    roasterId: "cafe-seongsu-mesh-coffee", roasterName: "메쉬커피",
    origin: "colombia", originKo: "콜롬비아", region: "우일라", process: "washed", roastLevel: 3,
    officialNotes: ["초콜릿", "캐러멜", "오렌지"],
    avgRating: 4.2, checkinCount: 58,
    avgProfile: { acidity: 4, sweetness: 7, body: 8, bitterness: 5, aftertaste: 6 },
    topFlavorTags: ["chocolate", "caramel", "nutty"],
    purchaseUrl: null,
  },
  {
    id: "bean-yirg", name: "에티오피아 예가체프 G1", slug: "yirgacheffe-g1",
    normalizedName: "에티오피아예가체프g1",
    roasterId: "cafe-mangwon-deep-blue-lake-coffee-roasters", roasterName: "딥블루레이크",
    origin: "ethiopia", originKo: "에티오피아", region: "예가체프", process: "natural", roastLevel: 2,
    officialNotes: ["딸기", "와인", "꿀"],
    avgRating: 4.7, checkinCount: 91,
    avgProfile: { acidity: 7, sweetness: 8, body: 5, bitterness: 2, aftertaste: 7 },
    topFlavorTags: ["berry", "winey", "honey"],
    purchaseUrl: null,
  },
  {
    id: "bean-kenya", name: "케냐 니에리 AA", slug: "nyeri-aa",
    normalizedName: "케냐니에리aa",
    roasterId: "cafe-hapjeong-anthracite-coffee-roasters", roasterName: "앤트러사이트 커피 합정",
    origin: "kenya", originKo: "케냐", region: "니에리", process: "washed", roastLevel: 3,
    officialNotes: ["블랙커런트", "자몽", "와이니"],
    avgRating: null, checkinCount: 4,
    avgProfile: null,
    topFlavorTags: ["citrus", "winey"],
    purchaseUrl: null,
  },
];

export const MOCK_CAFES: MockCafe[] = SEED_CAFES;
export const MOCK_BEANS: MockBean[] = [...DEMO_BEANS, ...SEED_BEANS];

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
