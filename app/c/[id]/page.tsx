import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RadarChart } from "@/components/RadarChart";
import { Wordmark } from "@/components/Wordmark";
import { BRAND } from "@/lib/brand";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import { decodeShareId } from "@/lib/shareCard";

/**
 * /c/[id] — 공유 딥링크 랜딩 (TECHNICAL_SPEC §3·§4, SSR, 비로그인 열람).
 * "카드가 유입, 랜딩이 전환" — 상단 CTA로 신규 유저를 체크인으로 데려온다.
 * id는 지금은 인코딩된 데이터 블롭이다 (lib/shareCard.ts 상단 주석 참조).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = decodeShareId(id);
  if (!data) return { title: BRAND.name };

  const title = `${data.beanName} · ★${data.rating.toFixed(1)} — ${BRAND.name}`;
  const description = `${data.subLabel}에서 마신 ${data.beanName}. ${BRAND.name}에서 커피 취향을 기록하세요.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SharedCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = decodeShareId(id);
  if (!data) notFound();

  const tagLabels = data.tags
    .map((t) => FLAVOR_TAGS.find((f) => f.id === t)?.label)
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <main className="relative flex min-h-dvh flex-col items-center overflow-hidden px-6 py-14 text-center">
      <div className="bg-aura absolute inset-x-0 top-0 h-[55dvh] opacity-60" aria-hidden />

      <Wordmark size="sm" className="relative" />

      <p className="relative mt-6 text-caption text-crema-400">{data.subLabel}</p>
      <h1 className="font-display relative mt-1 text-display text-crema-100">
        {data.beanName}
      </h1>

      <div className="relative my-5">
        <RadarChart profile={data.profile} size={240} />
      </div>

      <p className="font-mono relative text-h2 text-amber-glow">
        ★ {data.rating.toFixed(1)}
      </p>

      {tagLabels.length > 0 && (
        <div className="relative mt-3 flex flex-wrap justify-center gap-2">
          {tagLabels.map((label) => (
            <span
              key={label}
              className="rounded-full border border-roast-700 px-3 py-1 text-caption text-crema-400"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="relative mt-12 flex flex-col items-center gap-3">
        <Link
          href="/checkin"
          className="rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950"
        >
          내 커피 취향도 차트로
        </Link>
        <p className="max-w-xs text-caption text-crema-400">
          체크인마다 향미를 기록하면 나만의 취향 레이더가 완성돼요
        </p>
      </div>
    </main>
  );
}
