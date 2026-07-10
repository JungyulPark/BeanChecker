import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { cafesByDistrict, DISTRICTS } from "@/lib/mock/seed";

/**
 * /best/[district] — ISR, 지역 랭킹 (TECHNICAL_SPEC §4).
 * 5건 미달 카페는 랭킹에서 빼고 "신규 카페" 섹션으로 분리 (평점 노출 정책 확정 사항).
 */
export function generateStaticParams() {
  return DISTRICTS.map((d) => ({ district: d.id }));
}

export default async function BestPage({
  params,
}: {
  params: Promise<{ district: string }>;
}) {
  const { district } = await params;
  const districtInfo = DISTRICTS.find((d) => d.id === district);
  if (!districtInfo) notFound();

  const cafes = cafesByDistrict(district);
  const ranked = cafes
    .filter((c) => c.avgRating !== null)
    .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));
  const fresh = cafes.filter((c) => c.avgRating === null);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <Link href="/map" className="text-caption text-crema-400">
          ← 홈
        </Link>

        <header className="mt-4">
          <p className="text-caption text-crema-400">지역 베스트</p>
          <h1 className="font-display mt-1 text-display text-crema-100">
            {districtInfo.ko}
          </h1>
        </header>

        <nav className="mt-4 flex flex-wrap gap-2">
          {DISTRICTS.map((d) => (
            <Link
              key={d.id}
              href={`/best/${d.id}`}
              className={`rounded-full border px-3 py-1.5 text-caption ${
                d.id === district
                  ? "border-amber-glow bg-amber-glow text-roast-950"
                  : "border-roast-700 text-crema-400"
              }`}
            >
              {d.ko}
            </Link>
          ))}
        </nav>

        <section className="mt-6">
          {ranked.length === 0 ? (
            <p className="text-body text-crema-400">
              아직 랭킹에 오른 카페가 없어요 — 5건의 체크인이 모이면 순위가 열려요
            </p>
          ) : (
            <ol className="flex flex-col gap-2">
              {ranked.map((cafe, i) => (
                <li key={cafe.id}>
                  <Link
                    href={`/cafe/${cafe.district}/${cafe.slug}`}
                    className="flex items-center gap-3 glass-card px-4 py-3"
                  >
                    <span className="font-mono w-6 shrink-0 text-h2 text-amber-glow">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-crema-100">
                        {cafe.name}
                      </span>
                      <span className="block truncate text-caption text-crema-400">
                        {cafe.address}
                      </span>
                    </span>
                    <span className="font-mono shrink-0 text-body text-amber-glow">
                      ★ {cafe.avgRating!.toFixed(1)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {fresh.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-caption tracking-[0.08em] text-crema-400">신규 카페</h2>
            <ul className="flex flex-col gap-2">
              {fresh.map((cafe) => (
                <li key={cafe.id}>
                  <Link
                    href={`/cafe/${cafe.district}/${cafe.slug}`}
                    className="flex items-center justify-between glass-card px-4 py-3"
                  >
                    <span className="text-body text-crema-100">{cafe.name}</span>
                    <span className="text-caption text-crema-400">평가 수집 중</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
