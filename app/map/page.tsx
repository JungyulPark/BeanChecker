"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { BottomNav } from "@/components/BottomNav";
import { KakaoMap } from "@/components/KakaoMap";
import { Wordmark } from "@/components/Wordmark";
import { listCheckins, type LocalCheckin } from "@/lib/data/local";
import { MOCK_CAFES } from "@/lib/mock/seed";

/**
 * /map — 로그인 후 기본 진입점 (TECHNICAL_SPEC §4).
 * 체크인 안 할 때도 열 이유를 만드는 화면: 최근 내 체크인 + 근처 카페/로스터리 + 발견 진입점.
 * 실제 위치 기반 근접 정렬은 체크인 스텝1에서만 요청한다(GPS 거부율 최소화) — 이 화면은 지역 브라우징.
 */
export default function MapPage() {
  const [recent, setRecent] = useState<LocalCheckin[] | null>(null);

  useEffect(() => {
    listCheckins().then((all) => setRecent(all.slice(0, 3)));
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-8">
        <header className="mb-6 flex items-center justify-between">
          <Wordmark size="sm" underline={false} />
          <Link
            href="/checkin"
            className="pressable rounded-full bg-amber-glow px-4 py-2 text-caption font-semibold text-roast-950"
          >
            + 체크인
          </Link>
        </header>

        {/* 최근 내 체크인 — 있으면 바로 보여줘서 "다시 열 이유"를 만든다 */}
        {recent && recent.length > 0 && (
          <section className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-caption tracking-[0.08em] text-crema-400">
                최근 내 체크인
              </h2>
              <Link href="/diary" className="text-caption text-amber-glow">
                다이어리 전체 →
              </Link>
            </div>
            <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-1">
              {recent.map((c) => (
                <Link
                  key={c.id}
                  href="/diary"
                  className="w-40 shrink-0 snap-start glass-card p-2.5"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-[8px]">
                    <Image src={c.photoDataUrl} alt="" fill unoptimized className="object-cover" />
                  </div>
                  <p className="mt-2 truncate text-caption font-semibold text-crema-100">
                    {c.beanName}
                  </p>
                  <p className="font-mono text-caption text-amber-glow">★ {c.rating.toFixed(1)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 발견 진입점 — P4(다음 잔 막막함) 타겟 */}
        <section className="mb-8 grid grid-cols-2 gap-3">
          <Link
            href="/best/seongsu"
            className="glass-card pressable p-4"
          >
            <p className="text-body font-semibold text-crema-100">지역 베스트</p>
            <p className="mt-1 text-caption text-crema-400">평점 높은 카페·로스터리</p>
          </Link>
          <Link
            href="/flavor/berry"
            className="glass-card pressable p-4"
          >
            <p className="text-body font-semibold text-crema-100">향미로 찾기</p>
            <p className="mt-1 text-caption text-crema-400">베리, 초콜릿, 플로럴…</p>
          </Link>
        </section>

        {/* 실지도 — 카카오 JS 키가 설정된 환경에서만 렌더 (없으면 아래 리스트만) */}
        <KakaoMap cafes={MOCK_CAFES} />

        {/* 근처 카페/로스터리 (지역 브라우징) */}
        <section>
          <h2 className="mb-2 text-caption tracking-[0.08em] text-crema-400">
            로스터리·카페
          </h2>
          <ul className="flex flex-col gap-2">
            {MOCK_CAFES.map((cafe, i) => (
              <li
                key={cafe.id}
                className="stagger-item"
                style={{ "--stagger-i": i } as CSSProperties}
              >
                <Link
                  href={`/cafe/${cafe.district}/${cafe.slug}`}
                  className="flex items-center justify-between glass-card pressable px-4 py-3"
                >
                  <span className="min-w-0 flex-1 pr-3">
                    <span className="block truncate text-body font-semibold text-crema-100">
                      {cafe.name}
                    </span>
                    <span className="block truncate text-caption text-crema-400">
                      {cafe.districtKo} · {cafe.address}
                    </span>
                  </span>
                  {cafe.avgRating !== null ? (
                    <span className="font-mono shrink-0 text-body text-amber-glow">
                      ★ {cafe.avgRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-caption text-crema-400">평가 수집 중</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
