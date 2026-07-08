"use client";

import dynamic from "next/dynamic";

const BeanCanvas = dynamic(() => import("@/components/hero/BeanCanvas"), {
  ssr: false,
});

/**
 * 히어로 포스터 재생성용 개발 라우트 — 투명 배경으로 원두만 렌더.
 * public/hero-poster.png 갱신 절차: 이 페이지를 omitBackground로 스크린샷.
 */
export default function PosterDevPage() {
  return (
    <div
      style={{ width: 448, height: 448, background: "transparent" }}
      id="poster-stage"
    >
      <style>{`html, body { background: transparent !important; }`}</style>
      <BeanCanvas frozen />
    </div>
  );
}
