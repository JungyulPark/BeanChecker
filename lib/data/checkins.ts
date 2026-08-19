"use client";

import { get, set } from "idb-keyval";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { addCheckin, type LocalCheckin } from "@/lib/data/local";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * 체크인 쓰기 레이어 — 로컬이 선행 기록(write-ahead log), 서버가 정본.
 *
 * 왜 "서버에 바로 쓰기"가 아닌가:
 *   체크인은 카페 안에서 일어난다. 지하·구석 자리에서 신호가 끊기는 게 예외가 아니라 일상이다.
 *   서버 쓰기에 실패했다고 방금 평가한 한 잔이 사라지면 그 유저는 다시 안 쓴다.
 *   그래서 **무조건 IndexedDB에 먼저 남기고**, 로그인 상태면 서버로 밀어올린다.
 *   서버 반영이 끝난 기록은 remoteId를 갖는다 — 이게 곧 동기화 여부다.
 *
 * 왜 읽기는 아직 로컬만 보는가:
 *   기기 간 동기화(서버 → 로컬 병합)는 실 Supabase 프로젝트 없이는 검증할 방법이 없다.
 *   검증 못 한 병합 로직을 넣는 것보다, 지금 확실히 맞는 동작(내 기기 기록을 그대로 보여줌)을
 *   두고 서버 반영만 선행하는 쪽이 안전하다. 읽기 병합은 env가 붙은 뒤 별도로 짠다.
 */

const CHECKINS_KEY = "checkins";

/** 서버 반영이 끝난 로컬 기록에 붙는 표식 */
type SyncedCheckin = LocalCheckin & { remoteId?: string };

type SB = SupabaseClient<Database>;

async function markSynced(localId: string, remoteId: string) {
  const all = (await get<SyncedCheckin[]>(CHECKINS_KEY)) ?? [];
  await set(
    CHECKINS_KEY,
    all.map((c) => (c.id === localId ? { ...c, remoteId } : c)),
  );
}

/** 자연키로 카페를 찾는다. 유저가 즉석 등록한 카페(slug null)는 여기서 만들지 않는다 —
 *  카페 생성은 중복 카탈로그를 만들기 쉬워 admin 검수 경로로 보낸다(TECHNICAL_SPEC reports). */
async function resolveCafeId(sb: SB, c: LocalCheckin): Promise<string | null> {
  if (!c.cafeDistrict || !c.cafeSlug) return null;
  const { data } = await sb
    .from("cafes")
    .select("id")
    .eq("district", c.cafeDistrict)
    .eq("slug", c.cafeSlug)
    .maybeSingle();
  return data?.id ?? null;
}

function normalizeName(name: string) {
  return name.toLowerCase().replace(/[\s\-_.()]/g, "");
}

/**
 * 자연키로 원두를 찾고, 없으면 만든다.
 * 즉석 등록 원두(slug null)는 normalized_name으로 먼저 중복을 확인한다 —
 * 같은 원두가 유저마다 새 행으로 쌓이면 집계(5건 룰)가 영원히 안 채워진다.
 */
async function resolveBeanId(sb: SB, c: LocalCheckin): Promise<string | null> {
  if (c.beanSlug) {
    const { data } = await sb
      .from("beans")
      .select("id")
      .eq("origin", c.beanOrigin)
      .eq("slug", c.beanSlug)
      .maybeSingle();
    if (data) return data.id;
  }

  const normalized = normalizeName(c.beanName);
  const { data: dup } = await sb
    .from("beans")
    .select("id")
    .eq("origin", c.beanOrigin)
    .eq("normalized_name", normalized)
    .maybeSingle();
  if (dup) return dup.id;

  // 유저 생성 원두는 verified=false — /admin 검수와 병합 대상 (MVP §2-5)
  const { data: created, error } = await sb
    .from("beans")
    .insert({
      name: c.beanName,
      normalized_name: normalized,
      origin: c.beanOrigin,
      slug: `${normalized}-${c.beanOrigin}`.slice(0, 60),
      verified: false,
    })
    .select("id")
    .single();
  return error ? null : created.id;
}

/**
 * 사진 업로드. 스토리지 정책상 경로 첫 세그먼트가 uid여야 한다(0001 photos_write).
 * 실패하면 null을 돌려주고 사진 없이 진행한다 — 사진 때문에 기록 자체를 잃지 않는다.
 */
async function uploadPhoto(sb: SB, userId: string, dataUrl: string): Promise<string | null> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from("photos").upload(path, blob, {
      contentType: blob.type || "image/jpeg",
      upsert: false,
    });
    if (error) return null;
    return sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

/** 로컬 기록 1건을 서버로 밀어올린다. 성공하면 remote id, 실패하면 null. */
async function pushOne(sb: SB, userId: string, c: LocalCheckin): Promise<string | null> {
  const beanId = await resolveBeanId(sb, c);
  if (!beanId) return null; // 원두를 못 정하면 체크인 행을 만들 수 없다 (NOT NULL)

  const photoUrl = c.photoDataUrl ? await uploadPhoto(sb, userId, c.photoDataUrl) : null;

  const { data, error } = await sb
    .from("checkins")
    .insert({
      user_id: userId,
      bean_id: beanId,
      cafe_id: await resolveCafeId(sb, c),
      context: c.context,
      brew_method: c.brewMethod,
      rating: c.rating,
      profile: c.profile,
      flavor_tags: c.flavorTags,
      photo_url: photoUrl, // 0004에서 nullable — 사진은 선택이다
      gps_verified: c.gpsVerified,
      roast_date: c.roastDate,
      memo: c.memo ?? null,
      is_public: c.isPublic,
      created_at: c.createdAt, // 기록 시각은 마신 시각이지 동기화 시각이 아니다
    })
    .select("id")
    .single();

  return error ? null : data.id;
}

/**
 * 체크인 저장 — 앱에서 호출하는 유일한 쓰기 진입점.
 * 로컬 저장은 항상 성공한다. 서버 반영은 로그인·네트워크가 되면 덤으로 일어난다.
 */
export async function saveCheckin(
  input: Omit<LocalCheckin, "id" | "createdAt" | "hidden">,
  userId: string | null,
): Promise<LocalCheckin> {
  const record = await addCheckin(input);

  const sb = getBrowserSupabase();
  if (sb && userId) {
    const remoteId = await pushOne(sb, userId, record);
    if (remoteId) await markSynced(record.id, remoteId);
  }
  return record;
}

/**
 * 로그인 직후 호출 — 비로그인 상태로 쌓아둔 기록을 계정으로 옮긴다.
 * "로그인하면 그동안 쓴 게 사라진다"는 최악의 경험을 막는 장치.
 * 실패한 건은 로컬에 remoteId 없이 남으므로 다음 로그인 때 다시 시도된다(재실행 안전).
 */
export async function syncPendingCheckins(
  userId: string,
): Promise<{ pushed: number; failed: number }> {
  const sb = getBrowserSupabase();
  if (!sb) return { pushed: 0, failed: 0 };

  const all = (await get<SyncedCheckin[]>(CHECKINS_KEY)) ?? [];
  const pending = all.filter((c) => !c.remoteId);
  let pushed = 0;
  let failed = 0;

  for (const c of pending) {
    const remoteId = await pushOne(sb, userId, c);
    if (remoteId) {
      await markSynced(c.id, remoteId);
      pushed++;
    } else {
      failed++;
    }
  }
  return { pushed, failed };
}

/** 아직 서버에 올라가지 않은 기록 수 — UI에서 "N잔이 이 기기에만 있어요" 안내에 쓴다 */
export async function pendingCount(): Promise<number> {
  const all = (await get<SyncedCheckin[]>(CHECKINS_KEY)) ?? [];
  return all.filter((c) => !c.remoteId).length;
}
