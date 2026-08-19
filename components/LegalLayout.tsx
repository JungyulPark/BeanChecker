import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

/** 법적 고지 문서 공통 레이아웃 — 가독성 우선(Ugly 허용 대상 아님: 신뢰가 곧 전환) */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <Link href="/" className="inline-block">
        <Wordmark size="sm" underline={false} />
      </Link>
      <h1 className="font-display mt-6 text-h2 text-crema-100">{title}</h1>
      <p className="mt-1 text-caption text-crema-400">시행일 {updated}</p>
      <div className="legal mt-8">{children}</div>
      <nav className="mt-12 flex gap-4 text-caption text-crema-400">
        <Link href="/privacy" className="underline underline-offset-4">개인정보처리방침</Link>
        <Link href="/terms" className="underline underline-offset-4">이용약관</Link>
        <Link href="/" className="underline underline-offset-4">홈</Link>
      </nav>
    </main>
  );
}
