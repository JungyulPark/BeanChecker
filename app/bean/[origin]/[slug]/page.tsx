import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { RadarChart } from "@/components/RadarChart";
import { ReportButton } from "@/components/ReportButton";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import { findBean, findCafeById } from "@/lib/data/catalog";
import { MOCK_BEANS } from "@/lib/mock/seed";

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
export const revalidate = 300;

export function generateStaticParams() {
  return MOCK_BEANS.map((b) => ({ origin: b.origin, slug: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ origin: string; slug: string }>;
}) {
  const { origin, slug } = await params;
  const bean = await findBean(origin, slug);
  if (!bean) return {};
  const notes = bean.officialNotes.length > 0 ? ` 컵노트: ${bean.officialNotes.join(", ")}.` : "";
  return {
    title: `${bean.name} — ${bean.roasterName ?? bean.originKo} 원두 정보·향미 평가`,
    description: `${bean.originKo}${bean.region ? ` ${bean.region}` : ""} 원두.${notes} 커피인들의 실제 향미 프로필을 확인하세요.`,
    alternates: { canonical: `/bean/${origin}/${slug}` },
  };
}

export default async function BeanPage({
  params,
}: {
  params: Promise<{ origin: string; slug: string }>;
}) {
  const { origin, slug } = await params;
  const bean = await findBean(origin, slug);
  if (!bean) notFound();

  const roaster = bean.roasterId ? await findCafeById(bean.roasterId) : null;

  // 구조화 데이터 — 원두가 1차 개체라는 우리 모델을 검색엔진에도 그대로 전달
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: bean.name,
    category: "Specialty Coffee Beans",
    ...(bean.roasterName && { brand: { "@type": "Brand", name: bean.roasterName } }),
    ...(bean.officialNotes.length > 0 && { description: bean.officialNotes.join(", ") }),
    ...(bean.avgRating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: bean.avgRating,
        reviewCount: bean.checkinCount,
        bestRating: 5,
      },
    }),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <Link href="/map" className="text-caption text-crema-400">
          ← 홈
        </Link>

        <header className="mt-4">
          <span className="text-caption text-crema-400">
            {bean.originKo}
            {bean.region && ` · ${bean.region}`}
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

        {(bean.process !== null || bean.roastLevel !== null) && (
          <section className="mt-6 flex flex-wrap gap-2">
            {bean.process !== null && (
              <span className="rounded-full border border-roast-700 px-3 py-1 text-caption text-crema-400">
                {PROCESS_LABEL[bean.process]}
              </span>
            )}
            {bean.roastLevel !== null && (
              <span className="rounded-full border border-roast-700 px-3 py-1 text-caption text-crema-400">
                로스팅 레벨 {bean.roastLevel}
              </span>
            )}
          </section>
        )}

        <section className="mt-6 flex flex-col items-center glass-card p-5">
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
          className="pressable mt-8 block rounded-full bg-amber-glow px-8 py-3.5 text-center text-body font-semibold text-roast-950"
        >
          이 원두로 체크인하기
        </Link>

        {/* 구매 동선 — 로스터 공식몰로 보낸다 (Phase 3 파트너십·어필리에이트의 선행).
            UTM으로 우리 경유 트래픽을 로스터리 측 애널리틱스에 남긴다 — 파트너십 영업의 증거 데이터 */}
        {bean.purchaseUrl && (
          <a
            href={`${bean.purchaseUrl}${bean.purchaseUrl.includes("?") ? "&" : "?"}utm_source=bean_app&utm_medium=referral&utm_campaign=bean_page`}
            target="_blank"
            rel="noopener"
            className="pressable mt-3 block rounded-full border border-amber-glow/60 px-8 py-3.5 text-center text-body font-semibold text-amber-glow"
          >
            로스터 공식몰에서 구매 ↗
          </a>
        )}

        <div className="mt-6 flex justify-center">
          <ReportButton targetType="bean" targetId={bean.id} targetLabel={bean.name} />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
