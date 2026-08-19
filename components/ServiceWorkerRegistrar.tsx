"use client";

import { useEffect } from "react";

/**
 * SW 등록 — 개발 모드에서는 등록하지 않는다(HMR과 캐시가 충돌해 디버깅이 지옥이 된다).
 * 실패해도 앱은 정상 동작해야 하므로 조용히 삼킨다.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW 미지원·차단 환경 — 앱 동작에는 영향 없음 */
      });
    };
    // useEffect는 hydration 후에 돈다 = 대개 load 이후다.
    // 여기서 addEventListener("load")만 걸면 이미 지나간 이벤트를 기다리게 되어
    // SW가 영원히 등록되지 않는다 (실제로 그렇게 만들었다가 검증에서 잡았다).
    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
