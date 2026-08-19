/**
 * BUNNA Service Worker — PWA 마감 (CLAUDE.md 개발순서 7).
 *
 * 전략:
 *  - 내비게이션(HTML): network-first → 실패 시 캐시 → 그래도 없으면 /offline
 *    (기록 앱이라 "오래된 화면"보다 "최신 화면"이 중요. 오프라인은 폴백일 뿐)
 *  - 정적 자산(_next/static, 아이콘, 폰트): cache-first (해시 파일명이라 안전)
 *  - POST 등 비-GET, Supabase API 호출은 절대 캐시하지 않는다
 */
const VERSION = "bunna-v2"; // 캐시 무효화: v1의 Vary 매칭 버그 수정
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;
const OFFLINE_URL = "/offline";

const PRECACHE = [OFFLINE_URL, "/icon.svg", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // 외부 오리진(Supabase·카카오맵 등)은 SW가 관여하지 않는다
  if (url.origin !== self.location.origin) return;
  // 인증 콜백은 절대 캐시 금지
  if (url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          // ignoreVary 필수: Next.js는 HTML 응답에 Vary(RSC, Next-Router-State-Tree...)를
          // 붙인다. 기본 매칭은 Vary를 존중하므로 일반 내비게이션 요청이 캐시와 안 맞아
          // 방문했던 페이지조차 오프라인에서 폴백으로 떨어진다 (실측으로 잡은 버그).
          const hit = await caches.match(request, { ignoreVary: true });
          return hit ?? (await caches.match(OFFLINE_URL, { ignoreVary: true }));
        }),
    );
    return;
  }

  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request, { ignoreVary: true }).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(SHELL).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
