"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { RadarChart } from "@/components/RadarChart";
import { listCheckins, type LocalCheckin } from "@/lib/data/local";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import type { FlavorProfile } from "@/types/domain";

/**
 * 이 카페에서의 내 기록 — 카페 상세가 비어 보이던 문제의 핵심 보완.
 * 공개 집계(5건 룰)와 무관하게 내 기록은 1잔부터 보여준다 (DESIGN_DIRECTION §2 레이더 노출 규칙).
 * Supabase 연결 후에는 여기에 "이 카페의 공개 체크인"이 함께 붙는다.
 */
function avgProfile(list: LocalCheckin[]): FlavorProfile | null {
  if (list.length === 0) return null;
  const keys: (keyof FlavorProfile)[] = [
    "acidity",
    "sweetness",
    "body",
    "bitterness",
    "aftertaste",
  ];
  return Object.fromEntries(
    keys.map((k) => [k, list.reduce((s, c) => s + c.profile[k], 0) / list.length]),
  ) as unknown as FlavorProfile;
}

function tagLabel(id: string) {
  return FLAVOR_TAGS.find((t) => t.id === id)?.label ?? id;
}

export function CafeCheckins({ cafeId }: { cafeId: string }) {
  const [mine, setMine] = useState<LocalCheckin[] | null>(null);

  useEffect(() => {
    listCheckins().then((all) =>
      setMine(all.filter((c) => c.cafeId === cafeId && !c.hidden)),
    );
  }, [cafeId]);

  if (!mine || mine.length === 0) return null;

  const profile = avgProfile(mine);
  const avgRating = mine.reduce((s, c) => s + c.rating, 0) / mine.length;
  const topTags = [
    ...mine
      .flatMap((c) => c.flavorTags)
      .reduce((m, t) => m.set(t, (m.get(t) ?? 0) + 1), new Map<string, number>())
      .entries(),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-body font-semibold text-crema-100">여기서의 내 기록</h2>
        <span className="font-mono text-caption text-crema-400">
          {mine.length}잔 · ★ {avgRating.toFixed(1)}
        </span>
      </div>

      <div className="glass-card flex items-center gap-4 p-4">
        {profile && <RadarChart profile={profile} size={116} showLabels={false} />}
        <div className="min-w-0 flex-1">
          <p className="text-caption text-crema-400">이 카페에서 내가 느낀 향미</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {topTags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-amber-glow/50 px-2.5 py-0.5 text-caption text-amber-glow"
              >
                {tagLabel(t)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {mine.slice(0, 3).map((c) => (
          <li key={c.id} className="flex items-center gap-3 glass-card p-2.5">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[8px]">
              {c.photoDataUrl ? (
                <Image src={c.photoDataUrl} alt="" fill unoptimized className="object-cover" />
              ) : (
                <RadarChart profile={c.profile} size={54} showLabels={false} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body text-crema-100">{c.beanName}</p>
              <p className="font-mono text-caption text-crema-400">
                {new Date(c.createdAt).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <span className="font-mono shrink-0 text-body text-amber-glow">
              ★ {c.rating.toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
