"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getBrowserSupabase, isAuthConfigured } from "@/lib/supabase/browser";

/**
 * 세션 상태 — 앱 전역에서 "지금 로그인돼 있나"를 한 곳에서 답한다.
 *
 * 설계 전제: 로그인은 **선택**이다. env가 없어도, 로그인을 안 해도 앱은 온전히 돈다
 * (기록은 IndexedDB에 남는다). 그래서 이 컨텍스트는 "없음"을 에러가 아닌 정상 상태로 다룬다.
 *
 * status:
 *   "loading"  — 세션 확인 중 (깜빡임 방지용. UI는 이때 로그인/로그아웃 어느 쪽도 단정하지 않는다)
 *   "anon"     — 비로그인 (env 미설정 포함). 로컬 저장 경로.
 *   "authed"   — 로그인. 서버 저장 경로.
 */
type SessionState =
  | { status: "loading"; user: null }
  | { status: "anon"; user: null }
  | { status: "authed"; user: User };

const Ctx = createContext<SessionState>({ status: "loading", user: null });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  // env가 없으면 확인할 세션 자체가 없다 — loading을 거치지 않고 바로 anon
  const [state, setState] = useState<SessionState>(
    isAuthConfigured ? { status: "loading", user: null } : { status: "anon", user: null },
  );

  useEffect(() => {
    const sb = getBrowserSupabase();
    if (!sb) return;

    let alive = true;
    // getUser()는 토큰을 서버에서 검증한다 — getSession()은 로컬 저장값을 그대로 믿으므로 쓰지 않는다
    sb.auth.getUser().then(({ data }) => {
      if (!alive) return;
      setState(data.user ? { status: "authed", user: data.user } : { status: "anon", user: null });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setState(
        session?.user ? { status: "authed", user: session.user } : { status: "anon", user: null },
      );
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useSession() {
  return useContext(Ctx);
}
