import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin 임시 게이트 — Supabase Auth(profiles.is_admin) 연결 전까지의 스톱갭.
 * HTTP Basic Auth를 서버(엣지 미들웨어)에서 검사한다 — 비밀번호가 클라이언트 번들에
 * 노출되지 않는다는 점에서 클라이언트 사이드 비밀번호 체크와 근본적으로 다르다.
 *
 * fail-closed: ADMIN_BASIC_AUTH_USER/PASSWORD가 설정 안 되어 있으면 무조건 401 —
 * "설정 안 했으니 그냥 통과"를 절대 허용하지 않는다.
 *
 * TODO(Supabase 연결 후): 이 미들웨어를 지우고 Supabase 세션 + profiles.is_admin
 * 체크로 교체한다 (TECHNICAL_SPEC §3 Auth: "로그인 필수 라우트 = /checkin, /diary, /admin").
 */
export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const expectedUser = process.env.ADMIN_BASIC_AUTH_USER;
  const expectedPassword = process.env.ADMIN_BASIC_AUTH_PASSWORD;

  const unauthorized = () =>
    new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="admin"' },
    });

  if (!expectedUser || !expectedPassword) {
    // env 미설정 = 접근 불가. 조용히 열어주지 않는다 (fail-closed).
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = atob(authHeader.slice("Basic ".length));
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (user !== expectedUser || password !== expectedPassword) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
