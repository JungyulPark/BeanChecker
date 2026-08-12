import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { BRAND } from "@/lib/brand";
import { CafeCheckins } from "@/components/CafeCheckins";
import { ReportButton } from "@/components/ReportButton";
import { beansByRoaster, cafesByDistrict, findCafe } from "@/lib/data/catalog";
import { MOCK_CAFES } from "@/lib/mock/seed";

/**
 * /cafe/[district]/[slug] — ISR (TECHNICAL_SPEC §4).
 * 평점은 5건 룰: avgRating null이면 "평가 수집 중".
 * 읽기는 lib/data/catalog.ts — Supabase 우선, env 미설정 시 시드 폴백.
 * 사전 렌더는 시드 slug 기준, DB에만 있는 항목은 요청 시 렌더(dynamicParams).
 */
export const revalidate = 300;

export function generateStaticParams() {
  return MOCK_CAFES.map((c) => ({ district: c.district, slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ district: string; slug: string }>;
}) {
  const { district, slug } = await params;
  const cafe = await findCafe(district, slug);
  if (!cafe) return {};
  const rating = cafe.avgRating !== null ? ` 평점 ★${cafe.avgRating.toFixed(1)}.` : "";
  return {
    title: `${cafe.name} — ${cafe.districtKo} 스페셜티 ${cafe.isRoastery ? "로스터리" : "카페"}`,
    description: `${cafe.address}.${rating} ${cafe.name}의 원두와 커피인들의 향미 평가를 확인하세요.`,
    alternates: { canonical: `/cafe/${district}/${slug}` },
  };
}

export default async function CafePage({
  params,
}: {
  params: Promise<{ district: string; slug: string }>;
}) {
  const { district, slug } = await params;
  const cafe = await findCafe(district, slug);
  if (!cafe) notFound();

  const beans = await beansByRoaster(cafe.id);
  // 같은 동네 다른 로스터리 — 카페 대부분이 아직 원두 데이터가 없어(49곳 중 36곳)
  // 페이지가 비어 보이던 문제의 보완이자, P4(다음 잔의 막막함)로 이어지는 동선
  const nearby = (await cafesByDistrict(cafe.district))
    .filter((c) => c.id !== cafe.id)
    .slice(0, 5);

  // 구조화 데이터 — 카카오맵에 없는 "커피 맛" 정보의 검색 노출이 우리 SEO 차별점
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: cafe.name,
    address: { "@type": "PostalAddress", streetAddress: cafe.address, addressCountry: "KR" },
    servesCuisine: "Specialty Coffee",
    ...(cafe.avgRating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: cafe.avgRating,
        reviewCount: cafe.checkinCount,
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
          {cafe.isRoastery && (
            <span className="rounded-full border border-amber-glow/50 px-2.5 py-0.5 text-caption text-amber-glow">
              로스터리
            </span>
          )}
          <h1 className="font-display mt-2 text-display text-crema-100">{cafe.name}</h1>
          <p className="mt-1 text-body text-crema-400">
            {cafe.districtKo} · {cafe.address}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* 길찾기 — 키 없이 동작하는 카카오맵 공개 검색 URL (크롤링 아님) */}
            <a
              href={`https://map.kakao.com/?q=${encodeURIComponent(cafe.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="pressable inline-flex items-center gap-1.5 rounded-full border border-roast-700 px-3.5 py-1.5 text-caption text-crema-100"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.6" />
              </svg>
              길찾기
            </a>
            {/* 공식 채널 — 리서치 출처 중 공식 도메인·인스타만 노출 (기사·리뷰 사이트 제외) */}
            {cafe.websiteUrl && (
              <a
                href={`${cafe.websiteUrl}${cafe.websiteUrl.includes("?") ? "&" : "?"}utm_source=${BRAND.appId}&utm_medium=referral`}
                target="_blank"
                rel="noopener"
                className="pressable inline-flex items-center gap-1.5 rounded-full border border-roast-700 px-3.5 py-1.5 text-caption text-crema-100"
              >
                공식 채널 ↗
              </a>
            )}
          </div>
        </header>

        {/* 체크인 0인 카페에 "평가 수집 중 / 0" 두 개를 띄우면 죽은 화면이 된다 —
            숫자 대신 첫 기록으로 초대하는 한 줄로 바꾼다 */}
        {cafe.checkinCount === 0 ? (
          <section className="mt-6 glass-card px-4 py-3.5">
            <p className="text-body text-crema-100">아직 아무도 기록하지 않았어요</p>
            <p className="mt-0.5 text-caption text-crema-400">
              이 카페의 첫 번째 기록자가 되어보세요
            </p>
          </section>
        ) : (
          <section className="mt-6 grid grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <p className="text-caption text-crema-400">평점</p>
              {cafe.avgRating !== null ? (
                <p className="font-mono mt-1 text-h2 text-amber-glow">
                  ★ {cafe.avgRating.toFixed(1)}
                </p>
              ) : (
                <p className="mt-1 text-body text-crema-400">평가 수집 중</p>
              )}
            </div>
            <div className="glass-card p-4">
              <p className="text-caption text-crema-400">체크인</p>
              <p className="font-mono mt-1 text-h2 text-crema-100">{cafe.checkinCount}</p>
            </div>
          </section>
        )}

        {/* 원두 데이터가 아직 없는 카페(49곳 중 36곳)는 빈칸 대신 첫 기록으로 초대한다 */}
        {beans.length === 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-body font-semibold text-crema-100">이곳의 원두</h2>
            <div className="glass-card border-dashed p-6 text-center">
              <p className="text-body text-crema-100">아직 등록된 원두가 없어요</p>
              <p className="mt-1 text-caption text-crema-400">
                여기서 마신 원두를 기록하면 이 페이지의 첫 데이터가 됩니다
              </p>
              <Link
                href="/checkin"
                className="pressable mt-4 inline-block rounded-full bg-amber-glow px-6 py-2.5 text-caption font-semibold text-roast-950"
              >
                첫 원두 기록하기
              </Link>
            </div>
          </section>
        ) : (
          <section className="mt-8">
            <h2 className="mb-3 text-body font-semibold text-crema-100">이곳의 원두</h2>
            <ul className="flex flex-col gap-2">
              {beans.map((bean) => (
                <li key={bean.id}>
                  <Link
                    href={`/bean/${bean.origin}/${bean.slug}`}
                    className="flex items-center justify-between glass-card px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 pr-3">
                      <span className="block truncate text-body font-semibold text-crema-100">
                        {bean.name}
                      </span>
                      <span className="block truncate text-caption text-crema-400">
                        {bean.originKo}
                        {bean.region && ` · ${bean.region}`}
                      </span>
                    </span>
                    {bean.avgRating !== null ? (
                      <span className="font-mono shrink-0 text-body text-amber-glow">
                        ★ {bean.avgRating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-caption text-crema-400">수집 중</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 이 카페에서의 내 기록 (로컬) — 있을 때만 렌더 */}
        <CafeCheckins cafeId={cafe.id} />

        <Link
          href="/checkin"
          className="pressable mt-8 block rounded-full bg-amber-glow px-8 py-3.5 text-center text-body font-semibold text-roast-950"
        >
          여기서 체크인하기
        </Link>

        {/* 같은 동네 로스터리 — 다음 잔으로 이어지는 동선 (P4).
            동네에 이 카페뿐이면(해방촌·도화) 전체 둘러보기로 폴백 */}
        {nearby.length === 0 ? (
          <section className="mt-10 text-center">
            <Link href="/map" className="text-caption text-amber-glow">
              다른 로스터리 둘러보기 →
            </Link>
          </section>
        ) : (
          <section className="mt-10">
            <h2 className="mb-3 text-body font-semibold text-crema-100">
              {cafe.districtKo}의 다른 로스터리
            </h2>
            <ul className="flex flex-col gap-2">
              {nearby.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/cafe/${n.district}/${n.slug}`}
                    className="flex items-center justify-between glass-card pressable px-4 py-3"
                  >
                    <span className="min-w-0 flex-1 pr-3">
                      <span className="block truncate text-body text-crema-100">
                        {n.name}
                      </span>
                      <span className="block truncate text-caption text-crema-400">
                        {n.address}
                      </span>
                    </span>
                    {n.avgRating !== null ? (
                      <span className="font-mono shrink-0 text-body text-amber-glow">
                        ★ {n.avgRating.toFixed(1)}
                      </span>
                    ) : (
                      <span className="shrink-0 text-caption text-crema-400">수집 중</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={`/best/${cafe.district}`}
              className="mt-3 block text-center text-caption text-amber-glow"
            >
              {cafe.districtKo} 전체 보기 →
            </Link>
          </section>
        )}

        <div className="mt-8 flex justify-center">
          <ReportButton targetType="cafe" targetId={cafe.id} targetLabel={cafe.name} />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
