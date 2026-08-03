"use client";

import { useEffect, useMemo, useState } from "react";
import { MOCK_CAFES, DISTRICTS, type MockCafe } from "@/lib/mock/seed";
import { addLocalCafe, listLocalCafes, type LocalCafe } from "@/lib/data/local";
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
 *
 * 검색에 없는 카페는 즉석 등록(신선도 전략 1차 채널 — PRODUCT.md §4).
 * 원두는 등록되는데 카페는 안 되던 비대칭 해소. 등록 카페는 로컬 저장 후 재검색에도 노출.
 */

// 유저 등록 카페의 지역 선택지 — 시드 12개 지역 + 그 외
const DISTRICT_OPTIONS = [...DISTRICTS, { id: "etc", ko: "그 외 지역" }];

function localCafeToMock(c: LocalCafe): MockCafe {
  const seedDistrict = MOCK_CAFES.find((m) => m.district === c.district);
  return {
    id: c.id,
    name: c.name,
    slug: c.id, // 상세 페이지 없음 — 링크에 쓰이지 않는 자리표시자
    district: c.district,
    districtKo: c.districtKo,
    address: c.address,
    isRoastery: false, // 미확인 — verified 검수(Supabase 연결 후)에서 판별
    lat: seedDistrict?.lat ?? 37.5445, // 지역 중심 근사 — GPS 인증에는 쓰지 않는다
    lng: seedDistrict?.lng ?? 126.986,
    avgRating: null,
    checkinCount: 0,
  };
}

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
  const [myCafes, setMyCafes] = useState<MockCafe[]>([]);
  const [registering, setRegistering] = useState(false);
  const [newDistrict, setNewDistrict] = useState<string>(DISTRICT_OPTIONS[0].id);
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPosition().then((p) => {
      if (cancelled) return;
      setPos(p);
      setLocated(true);
    });
    listLocalCafes().then((list) => {
      if (!cancelled) setMyCafes(list.map(localCafeToMock));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const allCafes = useMemo(() => [...myCafes, ...MOCK_CAFES], [myCafes]);

  const cafes = useMemo(() => {
    const withDist = allCafes.map((cafe) => ({
      cafe,
      // 유저 등록 카페는 좌표가 근사값뿐 — 거리 표시/인증 대상에서 제외
      dist:
        pos && !cafe.id.startsWith("local-cafe-")
          ? haversineMeters(pos, { lat: cafe.lat, lng: cafe.lng })
          : null,
    }));
    const filtered = query
      ? withDist.filter(({ cafe }) =>
          cafe.name.toLowerCase().includes(query.toLowerCase()),
        )
      : withDist;
    return filtered.sort((a, b) => (a.dist ?? Infinity) - (b.dist ?? Infinity));
  }, [allCafes, query, pos]);

  const nearestDist = cafes[0]?.dist ?? null;
  const suggestHome =
    located && !query && (pos === null || (nearestDist !== null && nearestDist > GPS_VERIFY_RADIUS_M));

  const trimmed = query.trim();
  const exactMatch = allCafes.some(
    (c) => c.name.replace(/\s/g, "") === trimmed.replace(/\s/g, ""),
  );
  const canRegister = trimmed.length >= 2 && !exactMatch;

  const handleRegister = async () => {
    const d = DISTRICT_OPTIONS.find((x) => x.id === newDistrict)!;
    const record = await addLocalCafe({
      name: trimmed,
      district: d.id,
      districtKo: d.ko,
      address: newAddress.trim(),
    });
    const cafe = localCafeToMock(record);
    setMyCafes((prev) => [cafe, ...prev]);
    setRegistering(false);
    onSelectCafe(cafe, false); // 신규 카페는 좌표가 없어 GPS 인증 불가 — 배지 없이 기록
  };

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setRegistering(false);
        }}
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
          const isMine = cafe.id.startsWith("local-cafe-");
          return (
            <li key={cafe.id}>
              <button
                type="button"
                onClick={() => onSelectCafe(cafe, verifiable)}
                className="flex w-full items-center justify-between glass-card pressable px-4 py-3 text-left"
              >
                <span className="min-w-0 flex-1 pr-3">
                  <span className="block truncate text-body font-semibold text-crema-100">
                    {cafe.name}
                  </span>
                  <span className="block truncate text-caption text-crema-400">
                    {cafe.districtKo}
                    {cafe.address && ` · ${cafe.address}`}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  {isMine && (
                    <span className="block rounded-full border border-roast-700 px-2 py-0.5 text-caption text-crema-400">
                      내가 등록
                    </span>
                  )}
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

      {/* 검색에 없는 카페 → 즉석 등록 (원두 등록과 동일 패턴) */}
      {canRegister && !registering && (
        <button
          type="button"
          onClick={() => setRegistering(true)}
          className="glass-card pressable border-dashed px-4 py-2.5 text-body text-crema-400"
        >
          &ldquo;{trimmed}&rdquo; 새 카페로 등록
        </button>
      )}
      {canRegister && registering && (
        <div className="flex flex-col gap-2 glass-card p-3">
          <div className="flex items-center gap-2">
            <select
              value={newDistrict}
              onChange={(e) => setNewDistrict(e.target.value)}
              className="flex-1 rounded-card border border-roast-700 bg-roast-950 px-3 py-2 text-body text-crema-100"
            >
              {DISTRICT_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.ko}
                </option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="주소 (선택 — 알면 적어주세요)"
            className="w-full rounded-card border border-roast-700 bg-roast-950 px-3 py-2 text-body text-crema-100 placeholder:text-crema-400/60 focus:border-amber-glow focus:outline-none"
          />
          <button
            type="button"
            onClick={handleRegister}
            className="pressable rounded-full bg-amber-glow px-4 py-2 text-body font-semibold text-roast-950"
          >
            등록하고 계속
          </button>
        </div>
      )}

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
