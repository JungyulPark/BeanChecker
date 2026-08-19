import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * 1) Supabase 세션 쿠키 갱신 — 서버 컴포넌트는 쿠키를 쓸 수 없으므로 여기서 한다.
 * 2) /admin 게이트 — profiles.is_admin. Supabase 미설정 환경에서는 기존 Basic Auth로 폴백.
 *
 * fail-closed 원칙 유지: 어느 경로로도 "설정 안 됐으니 그냥 통과"는 없다.
 */
const ADMIN_PATH = "/admin";

function basicAuthGate(request: NextRequest) {
  const user = process.env.ADMIN_BASIC_AUTH_USER;
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  const unauthorized = () =>
    new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="admin"' },
    });

  if (!user || !password) return unauthorized();

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return unauthorized();

  let decoded = "";
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }
  const idx = decoded.indexOf(":");
  if (idx < 0) return unauthorized();
  if (decoded.slice(0, idx) !== user || decoded.slice(idx + 1) !== password) {
    return unauthorized();
  }
  return null; // 통과
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase 미설정 → 세션 개념이 없으므로 /admin은 Basic Auth 스톱갭으로
  if (!url || !key) {
    if (request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
      return basicAuthGate(request) ?? response;
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser()는 토큰을 서버에서 검증한다 — getSession()과 달리 위조 쿠키를 신뢰하지 않는다
  const { data: { user } } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    if (!user) {
      const login = request.nextUrl.clone();
      login.pathname = "/login";
      login.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(login);
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (error || data?.is_admin !== true) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return response;
}

export const config = {
  // 정적 자산·이미지는 세션 갱신이 불필요하므로 제외 (엣지 호출 비용·지연 절감)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
