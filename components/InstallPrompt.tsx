"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "bunna.install-dismissed";

/**
 * 홈 화면 추가 안내.
 * - Android/데스크톱: beforeinstallprompt 이벤트를 잡아 네이티브 설치 다이얼로그를 띄운다
 * - iOS Safari: 그 이벤트가 없다 — 공유 버튼 경로를 문구로 안내하는 것 외에 방법이 없다
 * 이미 설치(standalone)됐거나 한 번 닫은 유저에게는 다시 띄우지 않는다.
 */
type InstallEvent = Event & { prompt: () => Promise<void> };

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS Safari 판별 — beforeinstallprompt를 지원하지 않는 유일한 주요 환경
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIos && isSafari) setIosHint(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDeferred(null);
    setIosHint(false);
  };

  if (!deferred && !iosHint) return null;

  return (
    <div className="mt-8 glass-card p-4">
      <p className="text-body font-semibold text-crema-100">홈 화면에 추가하기</p>
      <p className="mt-1 text-caption text-crema-400">
        {deferred
          ? "앱처럼 한 번에 열 수 있어요."
          : "공유 버튼을 누르고 “홈 화면에 추가”를 선택하세요."}
      </p>
      <div className="mt-3 flex gap-2">
        {deferred && (
          <button
            type="button"
            onClick={async () => {
              await deferred.prompt();
              dismiss();
            }}
            className="pressable rounded-full bg-amber-glow px-5 py-2 text-caption font-semibold text-roast-950"
          >
            추가하기
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-roast-700 px-5 py-2 text-caption text-crema-400"
        >
          나중에
        </button>
      </div>
    </div>
  );
}
