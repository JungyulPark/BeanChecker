import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

export const metadata: Metadata = {
  title: "오프라인",
  robots: { index: false },
};

/** SW의 내비게이션 폴백. 기록은 기기에 남아 있다는 점을 분명히 알린다(불안 해소) */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <Wordmark size="sm" underline={false} />
      <h1 className="font-display mt-8 text-h2 text-crema-100">
        지금은 연결이
        <br />
        끊겨 있어요
      </h1>
      <p className="mt-3 text-body text-crema-400">
        인터넷이 돌아오면 이어서 볼 수 있어요.
        <br />
        기기에 저장된 기록은 그대로 있습니다.
      </p>
      <Link
        href="/diary"
        className="pressable mt-8 rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950"
      >
        내 기록 보기
      </Link>
    </main>
  );
}
