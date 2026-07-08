import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { RadarChart } from "@/components/RadarChart";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import { findBean, MOCK_BEANS, MOCK_CAFES } from "@/lib/mock/seed";

const PROCESS_LABEL: Record<string, string> = {
  washed: "워시드",
  natural: "내추럴",
  honey: "허니",
  anaerobic: "무산소 발효",
  other: "기타",
};

/**
 * /bean/[origin]/[slug] — ISR (TECHNICAL_SPEC §4).
 * 이 제품의 핵심 차별화: 카페가 아니라 원두가 1차 개체 (CLAUDE.md §1).
 * avgProfile은 5건 룰 미달 시 null — 레이더 대신 "평가 수집 중" 안내.
 */
export function generateStaticParams() {
  return MOCK_BEANS.map((b) => ({ origin: b.origin, slug: b.slug }));
}

export default async function BeanPage({
  params,
}: {
  params: Promise<{ origin: string; slug: string }>;
}) {
  const { origin, slug } = await params;
  const bean = findBean(origin, slug);
  if (!bean) notFound();

  const roaster = MOCK_CAFES.find((c) => c.id === bean.roasterId);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <Link href="/map" className="text-caption text-crema-400">
          ← 홈
        </Link>

        <header className="mt-4">
          <span className="text-caption text-crema-400">
            {bean.originKo} · {bean.region}
          </span>
          <h1 className="font-display mt-1 text-display text-crema-100">{bean.name}</h1>
          {roaster && (
            <Link
              href={`/cafe/${roaster.district}/${roaster.slug}`}
              className="mt-1 inline-block text-body text-amber-glow"
            >
              {roaster.name} →
            </Link>
          )}
        </header>

        <section className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full border border-roast-700 px-3 py-1 text-caption text-crema-400">
            {PROCESS_LABEL[bean.process ?? "other"]}
          </span>
          <span className="rounded-full border border-roast-700 px-3 py-1 text-caption text-crema-400">
            로스팅 레벨 {bean.roastLevel}
          </span>
        </section>

        <section className="mt-6 flex flex-col items-center rounded-card border border-roast-700 bg-roast-900 p-5">
          {bean.avgProfile ? (
            <>
              <RadarChart profile={bean.avgProfile} size={220} />
              <p className="font-mono mt-2 text-h2 text-amber-glow">
                ★ {bean.avgRating?.toFixed(1)}
              </p>
              <p className="text-caption text-crema-400">체크인 {bean.checkinCount}건</p>
            </>
          ) : (
            <p className="py-8 text-body text-crema-400">
              평가 수집 중 — 5건이 모이면 취향 프로필이 열려요
            </p>
          )}
        </section>

        {bean.topFlavorTags.length > 0 && (
          <section className="mt-4">
            <p className="mb-2 text-caption text-crema-400">체크인에서 많이 뽑힌 향미</p>
            <div className="flex flex-wrap gap-2">
              {bean.topFlavorTags.map((t) => {
                const label = FLAVOR_TAGS.find((f) => f.id === t)?.label ?? t;
                return (
                  <Link
                    key={t}
                    href={`/flavor/${t}`}
                    className="rounded-full border border-amber-glow/50 px-3 py-1 text-caption text-amber-glow"
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-6">
          <p className="mb-2 text-body font-semibold text-crema-100">로스터 공식 컵노트</p>
          <p className="text-body text-crema-400">{bean.officialNotes.join(" · ")}</p>
        </section>

        <Link
          href="/checkin"
          className="mt-8 block rounded-full bg-amber-glow px-8 py-3.5 text-center text-body font-semibold text-roast-950"
        >
          이 원두로 체크인하기
        </Link>
      </main>
      <BottomNav />
    </div>
  );
}
