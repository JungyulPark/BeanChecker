"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * 브라우저용 Supabase 클라이언트 (쿠키 기반 세션).
 * env 미설정 환경에서는 null — 호출부는 반드시 null 분기를 갖는다(로그인 없이도 앱이 돌아야 한다).
 * anon(publishable) 키만 사용 — service role 키는 어떤 경우에도 클라이언트에 두지 않는다(CLAUDE.md §6).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isAuthConfigured = Boolean(url && key);

let cached: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (!url || !key) return null;
  if (!cached) cached = createBrowserClient<Database>(url, key);
  return cached;
}
