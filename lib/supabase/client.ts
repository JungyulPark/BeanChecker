import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Supabase 클라이언트 — env 미설정 환경(로컬 개발, 프리뷰)에서는 null을 반환하고
 * 호출부가 시드 데이터로 폴백한다 (lib/data/catalog.ts). anon(publishable) 키만 사용 —
 * service role 키는 어떤 경우에도 여기 두지 않는다 (CLAUDE.md §6).
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> | null {
  if (!url || !anonKey) return null;
  if (!cached) cached = createClient<Database>(url, anonKey);
  return cached;
}
