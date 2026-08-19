import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

/**
 * OAuth 콜백 — 카카오가 code를 들고 여기로 돌아온다.
 * Supabase 대시보드의 Redirect URL은 Supabase 자신의 /auth/v1/callback이고,
 * 그 다음 여기로 넘어온다(supabase.auth.signInWithOAuth의 redirectTo).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/map";
  // 오픈 리다이렉트 방지: 같은 사이트의 절대경로만 허용
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/map";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=not_configured`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
