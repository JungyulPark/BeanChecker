"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MockCafe } from "@/lib/mock/seed";

/**
 * 카카오맵 실지도 — NEXT_PUBLIC_KAKAO_JS_KEY가 있을 때만 렌더 (없으면 null → 리스트 폴백).
 * 시드 CSV에는 좌표가 없으므로(지도 데이터 크롤링 금지 원칙) 주소를 카카오 공식
 * 지오코더로 클라이언트에서 해석하고 localStorage에 캐시한다 — 기기당 최초 1회.
 */

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const GEO_CACHE_KEY = "bean.geocache.v1";

type KakaoLatLng = object;
type KakaoMapObj = { setBounds(bounds: KakaoBounds): void };
type KakaoBounds = { extend(latlng: KakaoLatLng): void };
type KakaoMarker = object;
type KakaoGeocoder = {
  addressSearch(
    addr: string,
    cb: (result: { x: string; y: string }[], status: string) => void,
  ): void;
};
type KakaoMapsNS = {
  load(cb: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoBounds;
  Map: new (el: HTMLElement, opts: { center: KakaoLatLng; level: number }) => KakaoMapObj;
  Marker: new (opts: { map: KakaoMapObj; position: KakaoLatLng; title?: string }) => KakaoMarker;
  event: { addListener(target: KakaoMarker, type: string, cb: () => void): void };
  services: { Geocoder: new () => KakaoGeocoder; Status: { OK: string } };
};

declare global {
  interface Window {
    kakao?: { maps: KakaoMapsNS };
  }
}

function loadSdk(): Promise<KakaoMapsNS> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>("script[data-kakao-sdk]");
    const onReady = () => window.kakao!.maps.load(() => resolve(window.kakao!.maps));
    if (existing) {
      existing.addEventListener("load", onReady);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services`;
    script.async = true;
    script.dataset.kakaoSdk = "true";
    script.onload = onReady;
    script.onerror = () => reject(new Error("kakao sdk load failed"));
    document.head.appendChild(script);
  });
}

function readGeoCache(): Record<string, [number, number]> {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function KakaoMap({ cafes }: { cafes: MockCafe[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!KAKAO_KEY || !mapRef.current) return;
    let cancelled = false;

    loadSdk()
      .then(async (maps) => {
        if (cancelled || !mapRef.current) return;
        const map = new maps.Map(mapRef.current, {
          center: new maps.LatLng(37.5445, 126.986),
          level: 8,
        });
        setStatus("ready");

        const geocoder = new maps.services.Geocoder();
        const cache = readGeoCache();
        const bounds = new maps.LatLngBounds();
        let placed = 0;

        const geocode = (addr: string) =>
          new Promise<[number, number] | null>((resolve) => {
            geocoder.addressSearch(addr, (result, s) => {
              if (s === maps.services.Status.OK && result[0]) {
                resolve([parseFloat(result[0].y), parseFloat(result[0].x)]);
              } else resolve(null);
            });
          });

        for (const cafe of cafes) {
          if (cancelled) return;
          let coord = cache[cafe.address];
          if (!coord) {
            const r = await geocode(cafe.address);
            if (!r) continue; // 지번 표기 등으로 해석 실패 — 마커 생략
            coord = r;
            cache[cafe.address] = coord;
          }
          const pos = new maps.LatLng(coord[0], coord[1]);
          const marker = new maps.Marker({ map, position: pos, title: cafe.name });
          maps.event.addListener(marker, "click", () =>
            router.push(`/cafe/${cafe.district}/${cafe.slug}`),
          );
          bounds.extend(pos);
          placed++;
        }
        try {
          localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
        } catch {
          /* 저장 실패는 무시 — 다음 방문에 재지오코딩 */
        }
        if (placed > 1) map.setBounds(bounds);
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, [cafes, router]);

  if (!KAKAO_KEY || status === "error") return null;

  return (
    <section className="mb-8">
      <div className="glass-card overflow-hidden p-1">
        <div ref={mapRef} className="h-72 w-full rounded-[12px]">
          {status === "loading" && (
            <div className="flex h-full items-center justify-center text-caption text-crema-400">
              지도 불러오는 중…
            </div>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-right text-caption text-crema-400">
        마커를 탭하면 카페 페이지로 이동
      </p>
    </section>
  );
}
