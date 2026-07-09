import type { FlavorProfile } from "@/types/domain";
import type { FlavorTagId } from "@/lib/flavorTags";
import type { LocalCheckin } from "@/lib/data/local";

/**
 * 공유카드/`/c` 랜딩의 데이터 소스 — 스톱갭.
 * Supabase가 없는 지금은 체크인 핵심 필드를 URL 자체에 인코딩해서 어느 기기에서 열어도
 * `/c/{id}`가 동작하게 한다. `id`는 지금은 데이터 블롭이지만, Supabase 연결 시 실제
 * checkins.id(uuid)로 교체하고 이 인코딩 로직 대신 DB 조회로 바꾼다 — URL 형태(`/c/[id]`)는
 * 그대로 유지되므로 이미 공유된 링크는 안 깨진다.
 */
export type ShareCardData = {
  beanName: string;
  subLabel: string; // 카페명 또는 "홈브루"
  rating: number;
  profile: FlavorProfile;
  tags: FlavorTagId[];
};

export function shareCardDataFromCheckin(c: LocalCheckin): ShareCardData {
  return {
    beanName: c.beanName,
    subLabel: c.context === "home" ? "홈브루" : (c.cafeName ?? ""),
    rating: c.rating,
    profile: c.profile,
    tags: c.flavorTags,
  };
}

function toBase64(input: string): string {
  if (typeof window !== "undefined") {
    return btoa(unescape(encodeURIComponent(input)));
  }
  return Buffer.from(input, "utf-8").toString("base64");
}

function fromBase64(input: string): string {
  if (typeof window !== "undefined") {
    return decodeURIComponent(escape(atob(input)));
  }
  return Buffer.from(input, "base64").toString("utf-8");
}

function toUrlSafe(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(id: string): string {
  const padded = id + "=".repeat((4 - (id.length % 4)) % 4);
  return padded.replace(/-/g, "+").replace(/_/g, "/");
}

export function encodeShareId(data: ShareCardData): string {
  return toUrlSafe(toBase64(JSON.stringify(data)));
}

export function decodeShareId(id: string): ShareCardData | null {
  try {
    const parsed = JSON.parse(fromBase64(fromUrlSafe(id)));
    if (
      typeof parsed?.beanName !== "string" ||
      typeof parsed?.subLabel !== "string" ||
      typeof parsed?.rating !== "number" ||
      typeof parsed?.profile !== "object" ||
      !Array.isArray(parsed?.tags)
    ) {
      return null;
    }
    return parsed as ShareCardData;
  } catch {
    return null;
  }
}
