"use client";

import { get, set, del } from "idb-keyval";
import type { FlavorProfile } from "@/types/domain";
import type { FlavorTagId } from "@/lib/flavorTags";

/**
 * 로컬 데이터 레이어 — Supabase 프로젝트 연결 전까지의 저장소.
 * 원칙(DB가 유일한 영구 저장소)의 예외는 체크인 드래프트뿐이지만,
 * 백엔드 부재 상태에서는 완료된 체크인도 임시로 여기 둔다.
 * Supabase 연결 시 이 모듈만 supabase 구현으로 교체하고,
 * 로컬 체크인은 최초 로그인 시 서버로 마이그레이션한다.
 */

export type LocalCheckin = {
  id: string;
  context: "cafe" | "home";
  cafeId: string | null;
  cafeName: string | null;
  beanId: string;
  beanName: string;
  roasterName: string | null;
  brewMethod: "espresso" | "filter" | "other";
  rating: number;
  profile: FlavorProfile;
  flavorTags: FlavorTagId[];
  photoDataUrl: string | null; // 사진은 선택 — 인증은 보상이지 게이트가 아니다 (CLAUDE.md §1)
  gpsVerified: boolean;
  memo?: string;
  isPublic: boolean;
  hidden: boolean; // 신고 임시조치 (TECHNICAL_SPEC §1 checkins.hidden)
  createdAt: string; // ISO
};

export type CheckinDraft = Partial<Omit<LocalCheckin, "id" | "createdAt">> & {
  step?: number;
};

const DRAFT_KEY = "checkin-draft";
const CHECKINS_KEY = "checkins";

export async function loadDraft(): Promise<CheckinDraft | undefined> {
  return get<CheckinDraft>(DRAFT_KEY);
}

export async function saveDraft(draft: CheckinDraft): Promise<void> {
  await set(DRAFT_KEY, draft);
}

export async function clearDraft(): Promise<void> {
  await del(DRAFT_KEY);
}

export async function listCheckins(): Promise<LocalCheckin[]> {
  const all = (await get<LocalCheckin[]>(CHECKINS_KEY)) ?? [];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addCheckin(
  checkin: Omit<LocalCheckin, "id" | "createdAt" | "hidden">,
): Promise<LocalCheckin> {
  const record: LocalCheckin = {
    ...checkin,
    id: crypto.randomUUID(),
    hidden: false,
    createdAt: new Date().toISOString(),
  };
  const all = (await get<LocalCheckin[]>(CHECKINS_KEY)) ?? [];
  await set(CHECKINS_KEY, [...all, record]);
  return record;
}

export async function updateCheckinHidden(id: string, hidden: boolean): Promise<void> {
  const all = (await get<LocalCheckin[]>(CHECKINS_KEY)) ?? [];
  await set(
    CHECKINS_KEY,
    all.map((c) => (c.id === id ? { ...c, hidden } : c)),
  );
}

/**
 * 유저 등록 카페 — 데이터 신선도 전략의 1차 채널 (PRODUCT.md §4):
 * 새 카페는 운영자가 아니라 마시는 사람이 가장 먼저 안다.
 * 시딩에 없는 카페를 체크인 스텝1에서 즉석 등록하고, 이후 검색에도 노출한다.
 * Supabase 연결 시 cafes 테이블(created_by, verified=false)로 마이그레이션 —
 * verified 배지·admin 검수 파이프라인은 이미 스키마에 준비돼 있다.
 */
export type LocalCafe = {
  id: string; // "local-cafe-…" 접두 — 시드/DB id와 충돌 방지
  name: string;
  district: string;
  districtKo: string;
  address: string; // 선택 입력 — 비어 있을 수 있음
  createdAt: string;
};

const LOCAL_CAFES_KEY = "local-cafes";

export async function listLocalCafes(): Promise<LocalCafe[]> {
  return (await get<LocalCafe[]>(LOCAL_CAFES_KEY)) ?? [];
}

export async function addLocalCafe(
  cafe: Omit<LocalCafe, "id" | "createdAt">,
): Promise<LocalCafe> {
  const record: LocalCafe = {
    ...cafe,
    id: `local-cafe-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  const all = (await get<LocalCafe[]>(LOCAL_CAFES_KEY)) ?? [];
  await set(LOCAL_CAFES_KEY, [...all, record]);
  return record;
}

/**
 * 신고/제보 — TECHNICAL_SPEC §1 reports 테이블의 로컬 스톱갭.
 * insert는 누구나(로그인 유저), select/update는 admin만 — 지금은 실 Auth가 없어
 * /admin이 게이트 없이 열려 있다(주석·배너로 명시). Supabase 연결 시 RLS로 대체.
 */
export type ReportReason =
  | "spam"
  | "inappropriate_photo"
  | "defamation"
  | "wrong_info"
  | "other";

export type LocalReport = {
  id: string;
  targetType: "checkin" | "bean" | "cafe";
  targetId: string;
  targetLabel: string; // 표시용 — 로컬 스토어라 join이 없어 신고 시점 라벨을 같이 저장
  reason: ReportReason;
  memo?: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
};

const REPORTS_KEY = "reports";

export async function listReports(): Promise<LocalReport[]> {
  const all = (await get<LocalReport[]>(REPORTS_KEY)) ?? [];
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function addReport(
  report: Omit<LocalReport, "id" | "status" | "createdAt">,
): Promise<LocalReport> {
  const record: LocalReport = {
    ...report,
    id: crypto.randomUUID(),
    status: "open",
    createdAt: new Date().toISOString(),
  };
  const all = (await get<LocalReport[]>(REPORTS_KEY)) ?? [];
  await set(REPORTS_KEY, [...all, record]);
  return record;
}

export async function updateReportStatus(
  id: string,
  status: LocalReport["status"],
): Promise<void> {
  const all = (await get<LocalReport[]>(REPORTS_KEY)) ?? [];
  await set(
    REPORTS_KEY,
    all.map((r) => (r.id === id ? { ...r, status } : r)),
  );
}
