"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BRAND } from "@/lib/brand";
import { Wordmark } from "@/components/Wordmark";
import { getBrowserSupabase, isAuthConfigured } from "@/lib/supabase/browser";

const ERRORS: Record<string, string> = {
  missing_code: "로그인이 취소됐어요.",
  exchange_failed: "로그인 처리에 실패했어요. 다시 시도해주세요.",
  not_configured: "로그인이 아직 준비되지 않았어요.",
};

function LoginInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/map";
  const errorKey = params.get("error");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const signIn = async () => {
    const sb = getBrowserSupabase();
    if (!sb) return;
    setBusy(true);
    const { error } = await sb.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setFailed("로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
    }
  };

  const message = failed ?? (errorKey ? ERRORS[errorKey] ?? "로그인에 실패했어요." : null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-14 text-center">
      <Wordmark size="md" />
      <h1 className="font-display mt-8 text-h2 text-crema-100">
        기록을 잃지 않으려면
        <br />
        로그인이 필요해요
      </h1>
      <p className="mt-3 text-body text-crema-400">
        {BRAND.name}은 카카오 계정으로만 로그인합니다. 기기를 바꿔도 기록이 따라옵니다.
      </p>

      {message && (
        <p className="mt-5 rounded-card border border-amber-glow/50 px-4 py-2.5 text-caption text-amber-glow">
          {message}
        </p>
      )}

      {isAuthConfigured ? (
        <button
          type="button"
          onClick={signIn}
          disabled={busy}
          className="pressable mt-8 w-full rounded-full bg-[#FEE500] px-8 py-3.5 text-body font-semibold text-[#191600] disabled:opacity-50"
        >
          {busy ? "카카오로 이동 중…" : "카카오로 3초 만에 시작하기"}
        </button>
      ) : (
        <div className="mt-8 w-full glass-card border-dashed p-5">
          <p className="text-body text-crema-100">로그인 준비 중</p>
          <p className="mt-1 text-caption text-crema-400">
            지금은 로그인 없이도 기록할 수 있어요. 기록은 이 기기에 저장되고,
            로그인이 열리면 계정으로 옮겨집니다.
          </p>
        </div>
      )}

      <Link href="/map" className="mt-6 text-caption text-crema-400 underline underline-offset-4">
        로그인 없이 둘러보기
      </Link>

      <p className="mt-10 text-caption text-crema-400">
        계속하면{" "}
        <Link href="/terms" className="underline underline-offset-2">이용약관</Link>과{" "}
        <Link href="/privacy" className="underline underline-offset-2">개인정보처리방침</Link>에 동의하는 것으로 봅니다.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-dvh" />}>
      <LoginInner />
    </Suspense>
  );
}
