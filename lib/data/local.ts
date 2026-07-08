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
  photoDataUrl: string;
  gpsVerified: boolean;
  memo?: string;
  isPublic: boolean;
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
  checkin: Omit<LocalCheckin, "id" | "createdAt">,
): Promise<LocalCheckin> {
  const record: LocalCheckin = {
    ...checkin,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const all = (await get<LocalCheckin[]>(CHECKINS_KEY)) ?? [];
  await set(CHECKINS_KEY, [...all, record]);
  return record;
}
