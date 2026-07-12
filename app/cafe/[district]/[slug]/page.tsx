import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { ReportButton } from "@/components/ReportButton";
import { beansByRoaster, findCafe, MOCK_CAFES } from "@/lib/mock/seed";

/**
 * /cafe/[district]/[slug] — ISR (TECHNICAL_SPEC §4).
 * 평점은 5건 룰: avgRating null이면 "평가 수집 중", 개별 체크인은 항상 노출(여기선 목데이터라 생략).
 * 실 데이터 연결 시 이 페이지의 fetch를 Supabase 쿼리로 교체하고 revalidate: 3600 유지.
 */
export function generateStaticParams() {
  return MOCK_CAFES.map((c) => ({ district: c.district, slug: c.slug }));
}

export default async function CafePage({
  params,
}: {
  params: Promise<{ district: string; slug: string }>;
}) {
  const { district, slug } = await params;
  const cafe = findCafe(district, slug);
  if (!cafe) notFound();

  const beans = beansByRoaster(cafe.id);

  return (
    <div className="flex min-h-dvh flex-col">
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
        </header>

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

        {beans.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-body font-semibold text-crema-100">이곳의 원두</h2>
            <ul className="flex flex-col gap-2">
              {beans.map((bean) => (
                <li key={bean.id}>
                  <Link
                    href={`/bean/${bean.origin}/${bean.slug}`}
                    className="flex items-center justify-between glass-card px-4 py-3"
                  >
                    <span>
                      <span className="block text-body font-semibold text-crema-100">
                        {bean.name}
                      </span>
                      <span className="block text-caption text-crema-400">
                        {bean.originKo} · {bean.region}
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

        <Link
          href="/checkin"
          className="pressable mt-8 block rounded-full bg-amber-glow px-8 py-3.5 text-center text-body font-semibold text-roast-950"
        >
          여기서 체크인하기
        </Link>

        <div className="mt-6 flex justify-center">
          <ReportButton targetType="cafe" targetId={cafe.id} targetLabel={cafe.name} />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
