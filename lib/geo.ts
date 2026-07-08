/**
 * 좌표는 클라이언트에서만 사용한다 — 서버 전송·저장·로깅 금지 (TECHNICAL_SPEC §3 GPS).
 * 서버로 가는 것은 gps_verified 불리언뿐.
 */
export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s)));
}

/** 체크인 인증 반경 (TECHNICAL_SPEC §3: ≤300m → gps_verified) */
export const GPS_VERIFY_RADIUS_M = 300;

export function getPosition(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });
}
