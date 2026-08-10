import { getSupabase } from "@/lib/supabase/client";
import {
  MOCK_BEANS,
  MOCK_CAFES,
  DISTRICTS,
  type MockBean,
  type MockCafe,
} from "@/lib/mock/seed";
import type { FlavorProfile } from "@/types/domain";
import type { FlavorTagId } from "@/lib/flavorTags";
import type { Tables } from "@/lib/database.types";

/**
 * 카페·원두 카탈로그 읽기 레이어 — Supabase 우선, env 미설정/쿼리 실패 시 시드 폴백.
 * 쓰기(체크인·신고)는 auth 연동 전까지 lib/data/local.ts(IndexedDB) 유지.
 *
 * 주의: 한 화면 안에서는 한 소스만 쓴다 — findCafe가 DB에서 왔으면 beansByRoaster도
 * 같은 uuid로 DB를 본다 (시드 id "cafe-…"와 DB uuid는 호환되지 않음).
 *
 * topFlavorTags는 아직 DB 컬럼이 없다(스펙상 체크인 집계에서 파생 예정) —
 * DB 원두는 (origin,slug)로 시드와 매칭해 컵노트 기반 태그를 가져온다.
 */

const DISTRICT_KO = new Map(DISTRICTS.map((d) => [d.id, d.ko]));
const SEED_TAGS = new Map(
  MOCK_BEANS.map((b) => [`${b.origin}/${b.slug}`, b.topFlavorTags]),
);
// 구매/공식채널 링크는 아직 DB 컬럼이 없다 — 시드 매칭으로 보강 (컬럼 추가 시 이 맵 제거)
const SEED_PURCHASE = new Map(
  MOCK_BEANS.map((b) => [`${b.origin}/${b.slug}`, b.purchaseUrl]),
);
const SEED_WEBSITE = new Map(
  MOCK_CAFES.map((c) => [`${c.district}/${c.slug}`, c.websiteUrl]),
);
const DISTRICT_COORD = new Map(
  MOCK_CAFES.map((c) => [c.district, { lat: c.lat, lng: c.lng }]),
);

const PROCESSES = ["washed", "natural", "honey", "anaerobic", "other"] as const;

function mapCafe(row: Tables<"cafes">): MockCafe {
  const coord = DISTRICT_COORD.get(row.district) ?? { lat: 37.5445, lng: 126.986 };
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    district: row.district,
    districtKo: DISTRICT_KO.get(row.district) ?? row.district,
    address: row.address,
    isRoastery: row.is_roastery,
    lat: coord.lat,
    lng: coord.lng,
    avgRating: row.avg_rating,
    checkinCount: row.checkin_count,
    websiteUrl: SEED_WEBSITE.get(`${row.district}/${row.slug}`) ?? null,
  };
}

function mapBean(row: Tables<"beans">, roasterName: string | null): MockBean {
  const process = PROCESSES.find((p) => p === row.process) ?? null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    normalizedName: row.normalized_name,
    roasterId: row.roaster_id,
    roasterName,
    origin: row.origin,
    originKo: ORIGIN_KO[row.origin] ?? row.origin,
    region: row.region ?? "",
    process,
    roastLevel: row.roast_level,
    officialNotes: row.official_notes ?? [],
    avgRating: row.avg_rating,
    checkinCount: row.checkin_count,
    avgProfile: (row.avg_profile as FlavorProfile | null) ?? null,
    topFlavorTags: SEED_TAGS.get(`${row.origin}/${row.slug}`) ?? [],
    purchaseUrl: SEED_PURCHASE.get(`${row.origin}/${row.slug}`) ?? null,
  };
}

const ORIGIN_KO: Record<string, string> = {
  ethiopia: "에티오피아",
  colombia: "콜롬비아",
  kenya: "케냐",
  guatemala: "과테말라",
  panama: "파나마",
  brazil: "브라질",
  blend: "블렌드",
  other: "기타",
};

type BeanRowWithRoaster = Tables<"beans"> & { cafes: { name: string } | null };

export async function listCafes(): Promise<MockCafe[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("cafes")
      .select("*")
      .order("checkin_count", { ascending: false });
    if (!error && data && data.length > 0) return data.map(mapCafe);
  }
  return MOCK_CAFES;
}

export async function cafesByDistrict(district: string): Promise<MockCafe[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("cafes").select("*").eq("district", district);
    if (!error && data && data.length > 0) return data.map(mapCafe);
  }
  return MOCK_CAFES.filter((c) => c.district === district);
}

export async function findCafe(district: string, slug: string): Promise<MockCafe | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("cafes")
      .select("*")
      .eq("district", district)
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) return mapCafe(data);
  }
  return MOCK_CAFES.find((c) => c.district === district && c.slug === slug) ?? null;
}

export async function findCafeById(id: string): Promise<MockCafe | null> {
  const sb = getSupabase();
  // 시드 id("cafe-…")로는 DB를 조회하지 않는다 — 소스 일관성 규칙
  if (sb && !id.startsWith("cafe-")) {
    const { data, error } = await sb.from("cafes").select("*").eq("id", id).maybeSingle();
    if (!error && data) return mapCafe(data);
  }
  return MOCK_CAFES.find((c) => c.id === id) ?? null;
}

export async function findBean(origin: string, slug: string): Promise<MockBean | null> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("beans")
      .select("*, cafes:roaster_id(name)")
      .eq("origin", origin)
      .eq("slug", slug)
      .maybeSingle();
    if (!error && data) {
      const row = data as BeanRowWithRoaster;
      return mapBean(row, row.cafes?.name ?? null);
    }
  }
  return MOCK_BEANS.find((b) => b.origin === origin && b.slug === slug) ?? null;
}

export async function beansByRoaster(roasterId: string): Promise<MockBean[]> {
  const sb = getSupabase();
  // 시드 id("cafe-…")로는 DB를 조회하지 않는다 — 소스 일관성 규칙
  if (sb && !roasterId.startsWith("cafe-")) {
    const { data, error } = await sb
      .from("beans")
      .select("*, cafes:roaster_id(name)")
      .eq("roaster_id", roasterId);
    if (!error && data) {
      return (data as BeanRowWithRoaster[]).map((r) => mapBean(r, r.cafes?.name ?? null));
    }
  }
  return MOCK_BEANS.filter((b) => b.roasterId === roasterId);
}

export async function beansByFlavorTag(tag: FlavorTagId): Promise<MockBean[]> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb.from("beans").select("*, cafes:roaster_id(name)");
    if (!error && data && data.length > 0) {
      return (data as BeanRowWithRoaster[])
        .map((r) => mapBean(r, r.cafes?.name ?? null))
        .filter((b) => b.topFlavorTags.includes(tag));
    }
  }
  return MOCK_BEANS.filter((b) => b.topFlavorTags.includes(tag));
}
