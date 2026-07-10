"use client";

import { useEffect, useMemo, useState } from "react";
import { MOCK_CAFES, type MockCafe } from "@/lib/mock/seed";
import {
  getPosition,
  haversineMeters,
  GPS_VERIFY_RADIUS_M,
  type LatLng,
} from "@/lib/geo";

/**
 * 스텝1: 카페 선택.
 * 위치권한은 이 스텝 진입 시 요청 (앱 진입 시 아님 — 거부율 최소화, TECHNICAL_SPEC §3).
 * 좌표는 근접 정렬·거리 계산에만 쓰고 어디에도 저장·전송하지 않는다.
 */
export function StepCafe({
  onSelectCafe,
  onSelectHome,
}: {
  onSelectCafe: (cafe: MockCafe, gpsVerified: boolean) => void;
  onSelectHome: () => void;
}) {
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<LatLng | null>(null);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPosition().then((p) => {
      if (cancelled) return;
      setPos(p);
      setLocated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cafes = useMemo(() => {
    const withDist = MOCK_CAFES.map((cafe) => ({
      cafe,
      dist: pos ? haversineMeters(pos, { lat: cafe.lat, lng: cafe.lng }) : null,
    }));
    const filtered = query
      ? withDist.filter(({ cafe }) =>
          cafe.name.toLowerCase().includes(query.toLowerCase()),
        )
      : withDist;
    return filtered.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
  }, [query, pos]);

  const nearestDist = cafes[0]?.dist ?? null;
  const suggestHome =
    located && !query && (pos === null || (nearestDist !== null && nearestDist > GPS_VERIFY_RADIUS_M));

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="카페 이름 검색"
        className="w-full glass-card px-4 py-3 text-body text-crema-100 placeholder:text-crema-400/60 focus:border-amber-glow focus:outline-none"
      />

      {suggestHome && (
        <button
          type="button"
          onClick={onSelectHome}
          className="rounded-card border border-amber-glow/40 bg-roast-900 px-4 py-3 text-left text-body text-crema-100"
        >
          지금 카페 근처가 아니네요 —{" "}
          <span className="font-semibold text-amber-glow">홈브루로 기록할까요?</span>
        </button>
      )}

      <ul className="flex flex-col gap-2">
        {cafes.map(({ cafe, dist }) => {
          const verifiable = dist !== null && dist <= GPS_VERIFY_RADIUS_M;
          return (
            <li key={cafe.id}>
              <button
                type="button"
                onClick={() => onSelectCafe(cafe, verifiable)}
                className="flex w-full items-center justify-between glass-card px-4 py-3 text-left"
              >
                <span>
                  <span className="block text-body font-semibold text-crema-100">
                    {cafe.name}
                  </span>
                  <span className="block text-caption text-crema-400">
                    {cafe.districtKo} · {cafe.address}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {verifiable && (
                    <span className="block rounded-full border border-amber-glow px-2 py-0.5 text-caption text-amber-glow">
                      인증 가능
                    </span>
                  )}
                  {dist !== null && (
                    <span className="font-mono mt-1 block text-caption text-crema-400">
                      {dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onSelectHome}
        className="py-2 text-body text-crema-400 underline underline-offset-4"
      >
        카페가 아니에요 — 홈브루로 기록하기
      </button>
    </div>
  );
}
