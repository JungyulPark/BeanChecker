"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { RadarChart } from "@/components/RadarChart";
import { ReportButton } from "@/components/ReportButton";
import { listCheckins, type LocalCheckin } from "@/lib/data/local";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import type { FlavorProfile } from "@/types/domain";

/**
 * 내 기록은 1잔부터 레이더를 연다.
 * 5건·10건 룰은 **공개 집계**(원두·카페 평균, user_stats)에 적용되는 정책이지
 * 내 개인 기록에 적용할 이유가 없다 — 그동안 이걸 과하게 적용해서
 * 제품의 시그니처(레이더)를 스스로 가리고 있었다 (DESIGN_DIRECTION §2).
 * 대신 표본 수를 함께 표시해 "몇 잔 기준인지"를 정직하게 알린다.
 */
const RADAR_SETTLED_CHECKINS = 10; // 이 이상이면 "취향이 잡혔다"고 표현

function tagLabel(id: string) {
  return FLAVOR_TAGS.find((t) => t.id === id)?.label ?? id;
}

function avgProfile(checkins: LocalCheckin[]): FlavorProfile | null {
  if (checkins.length === 0) return null;
  const sum = checkins.reduce(
    (acc, c) => ({
      acidity: acc.acidity + c.profile.acidity,
      sweetness: acc.sweetness + c.profile.sweetness,
      body: acc.body + c.profile.body,
      bitterness: acc.bitterness + c.profile.bitterness,
      aftertaste: acc.aftertaste + c.profile.aftertaste,
    }),
    { acidity: 0, sweetness: 0, body: 0, bitterness: 0, aftertaste: 0 },
  );
  const n = checkins.length;
  return {
    acidity: sum.acidity / n,
    sweetness: sum.sweetness / n,
    body: sum.body / n,
    bitterness: sum.bitterness / n,
    aftertaste: sum.aftertaste / n,
  };
}

export default function DiaryPage() {
  const [checkins, setCheckins] = useState<LocalCheckin[] | null>(null);

  useEffect(() => {
    listCheckins().then(setCheckins);
  }, []);

  const stats = useMemo(() => {
    if (!checkins || checkins.length === 0) return null;
    const avgRating =
      checkins.reduce((s, c) => s + c.rating, 0) / checkins.length;
    const tagCounts = new Map<string, number>();
    for (const c of checkins)
      for (const t of c.flavorTags)
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const topTags = [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
    return { avgRating, topTags, profile: avgProfile(checkins) };
  }, [checkins]);

  if (checkins === null) {
    return (
      <div className="flex min-h-dvh flex-col">
        <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
          <p className="text-body text-crema-400">불러오는 중…</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/map" className="text-caption text-crema-400">
          ← 홈
        </Link>
        <Link
          href="/checkin"
          className="pressable rounded-full bg-amber-glow px-4 py-2 text-caption font-semibold text-roast-950"
        >
          + 체크인
        </Link>
      </header>

      <h1 className="font-display text-h2 text-crema-100">커피 다이어리</h1>

      {checkins.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-body text-crema-400">
            아직 기록된 잔이 없어요.
            <br />첫 잔부터 시작해볼까요?
          </p>
          <Link
            href="/checkin"
            className="pressable rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950"
          >
            첫 잔 기록하기
          </Link>
        </div>
      ) : (
        <>
          {/* 통계 */}
          <section className="mt-5 grid grid-cols-2 gap-3">
            <div className="glass-card p-4">
              <p className="text-caption text-crema-400">기록한 잔</p>
              <p className="font-mono mt-1 text-h2 text-crema-100">
                {checkins.length}
              </p>
            </div>
            <div className="glass-card p-4">
              <p className="text-caption text-crema-400">평균 별점</p>
              <p className="font-mono mt-1 text-h2 text-amber-glow">
                ★ {stats!.avgRating.toFixed(1)}
              </p>
            </div>
          </section>

          {/* 취향 레이더 — 내 기록은 1잔부터 (공개 집계 룰과 별개) */}
          <section className="mt-3 glass-card p-4">
            <div className="flex items-baseline justify-between">
              <p className="text-caption text-crema-400">나의 취향 레이더</p>
              <p className="font-mono text-caption text-crema-400">
                {checkins.length}잔 기준
              </p>
            </div>
            {stats!.profile && (
              <div className="mt-2 flex flex-col items-center">
                <RadarChart profile={stats!.profile} size={220} />
                <div className="mt-2 flex gap-1.5">
                  {stats!.topTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-amber-glow/50 px-2.5 py-0.5 text-caption text-amber-glow"
                    >
                      {tagLabel(t)}
                    </span>
                  ))}
                </div>
                {checkins.length < RADAR_SETTLED_CHECKINS && (
                  <p className="mt-3 text-center text-caption text-crema-400">
                    아직 표본이 적어요 —{" "}
                    <span className="font-mono text-crema-100">
                      {checkins.length}/{RADAR_SETTLED_CHECKINS}
                    </span>
                    잔이 쌓이면 취향의 윤곽이 뚜렷해져요
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 타임라인 */}
          <section className="mt-8 flex flex-col gap-3">
            {checkins.map((c) => (
              <article
                key={c.id}
                className="flex gap-3 glass-card p-3"
              >
                {/* 사진이 없으면 향미 레이더가 썸네일 자리를 대신한다 —
                    사진 없는 기록도 시각적으로 비지 않게(시그니처 노출) */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[10px]">
                  {c.photoDataUrl ? (
                    <Image
                      src={c.photoDataUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <RadarChart profile={c.profile} size={78} showLabels={false} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-body font-semibold text-crema-100">
                      {c.beanName}
                    </p>
                    <span className="font-mono shrink-0 text-body text-amber-glow">
                      ★ {c.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-caption text-crema-400">
                    {c.context === "home" ? "홈브루" : c.cafeName}
                    {c.gpsVerified && " · 인증됨"}
                    {c.hidden && " · 숨김 처리됨"}
                    {" · "}
                    <span className="font-mono">
                      {new Date(c.createdAt).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {c.flavorTags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-roast-700 px-2 py-0.5 text-caption text-crema-400"
                      >
                        {tagLabel(t)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-1.5">
                    <ReportButton targetType="checkin" targetId={c.id} targetLabel={c.beanName} />
                  </div>
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </main>
    <BottomNav />
    </div>
  );
}
