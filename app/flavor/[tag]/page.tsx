import Link from "next/link";
import { notFound } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { FLAVOR_TAG_GROUPS, FLAVOR_TAGS } from "@/lib/flavorTags";
import { beansByFlavorTag } from "@/lib/mock/seed";

/**
 * /flavor/[tag] — ISR, 태그별 원두 (TECHNICAL_SPEC §4).
 * P4(다음 잔 막막함) 타겟: "베리 계열 원두 잘하는 곳" 같은 검색이 성립하게 하는 페이지.
 */
export function generateStaticParams() {
  return FLAVOR_TAGS.map((t) => ({ tag: t.id }));
}

export default async function FlavorPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const tagInfo = FLAVOR_TAGS.find((t) => t.id === tag);
  if (!tagInfo) notFound();

  const beans = beansByFlavorTag(tagInfo.id).sort(
    (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0),
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <Link href="/map" className="text-caption text-crema-400">
          ← 홈
        </Link>

        <header className="mt-4">
          <p className="text-caption text-crema-400">향미로 찾기</p>
          <h1 className="font-display mt-1 text-display text-crema-100">{tagInfo.label}</h1>
        </header>

        <div className="mt-4 flex flex-col gap-4">
          {FLAVOR_TAG_GROUPS.map((group) => (
            <div key={group.group} className="flex flex-wrap gap-2">
              {group.tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/flavor/${t.id}`}
                  className={`rounded-full border px-3 py-1.5 text-caption ${
                    t.id === tag
                      ? "border-amber-glow bg-amber-glow text-roast-950"
                      : "border-roast-700 text-crema-400"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <section className="mt-6">
          {beans.length === 0 ? (
            <p className="text-body text-crema-400">
              아직 &ldquo;{tagInfo.label}&rdquo; 태그로 기록된 원두가 없어요
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {beans.map((bean) => (
                <li key={bean.id}>
                  <Link
                    href={`/bean/${bean.origin}/${bean.slug}`}
                    className="flex items-center justify-between glass-card px-4 py-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body font-semibold text-crema-100">
                        {bean.name}
                      </span>
                      <span className="block truncate text-caption text-crema-400">
                        {bean.roasterName}
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
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
