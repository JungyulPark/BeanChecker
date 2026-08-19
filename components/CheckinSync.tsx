"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth/session";
import { syncPendingCheckins } from "@/lib/data/checkins";

/**
 * 로그인이 확인되면 이 기기에만 있던 기록을 계정으로 올린다.
 *
 * 화면이 아니라 레이아웃에 두는 이유: 로그인 직후 어디로 돌아오든(/map, /diary, 딥링크)
 * 한 번은 반드시 실행돼야 하기 때문. 콜백 라우트는 서버라 IndexedDB에 못 닿는다.
 *
 * 실패한 건은 로컬에 그대로 남아 다음 로그인 때 다시 시도된다 — 조용히 유실되지 않는다.
 */
export function CheckinSync() {
  const { status, user } = useSession();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authed") return;
    if (syncedFor.current === user.id) return; // 같은 세션에서 중복 실행 방지
    syncedFor.current = user.id;
    void syncPendingCheckins(user.id);
  }, [status, user]);

  return null;
}
