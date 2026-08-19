import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

/**
 * 서버 컴포넌트/라우트 핸들러용 Supabase 클라이언트.
 * env 미설정이면 null을 반환해 호출부가 비로그인 경로로 흐르게 한다.
 *
 * 주의: 서버 컴포넌트에서는 쿠키 쓰기가 불가능하다(Next.js 제약). 세션 갱신은
 * middleware가 담당하므로 여기서의 set 실패는 무시해도 안전하다.
 */
export async function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const store = await cookies();
  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // 서버 컴포넌트에서 호출된 경우 — middleware가 갱신을 담당하므로 무시
        }
      },
    },
  });
}

/** 현재 로그인 유저 (없으면 null). 비로그인·env미설정 모두 null로 수렴 */
export async function getCurrentUser() {
  const sb = await getServerSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/** admin 여부 — profiles.is_admin. 실패 시 false (fail-closed) */
export async function isCurrentUserAdmin() {
  const sb = await getServerSupabase();
  if (!sb) return false;
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return false;
  const { data, error } = await sb
    .from("profiles")
    .select("is_admin")
    .eq("id", auth.user.id)
    .maybeSingle();
  return !error && data?.is_admin === true;
}
