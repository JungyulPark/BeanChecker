"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";

const BeanCanvas = dynamic(() => import("./BeanCanvas"), { ssr: false });

/**
 * Poster-first (LCP 예산과의 계약 — TECHNICAL_SPEC §6):
 * 사전 렌더 포스터 PNG 즉시 출력 → idle 후 3D lazy 마운트 → 크로스페이드.
 * prefers-reduced-motion은 포스터 고정, deviceMemory<4GB는 3D 미마운트.
 */
export function HeroBean() {
  const [mount3d, setMount3d] = useState(false);
  const [ready3d, setReady3d] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory;
    if (memory !== undefined && memory < 4) return;

    const start = () => setMount3d(true);
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 2500 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 800);
    return () => clearTimeout(id);
  }, []);

  // 3D 마운트 후 첫 프레임들이 그려질 시간을 주고 크로스페이드
  useEffect(() => {
    if (!mount3d) return;
    const id = setTimeout(() => setReady3d(true), 600);
    return () => clearTimeout(id);
  }, [mount3d]);

  return (
    <div className="relative h-[45dvh] w-full max-w-md">
      <Image
        src="/hero-poster.png"
        alt="로스팅된 커피 원두"
        fill
        priority
        sizes="(max-width: 448px) 100vw, 448px"
        className={`object-contain transition-opacity duration-700 ${
          ready3d ? "opacity-0" : "opacity-100"
        }`}
      />
      {mount3d && (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            ready3d ? "opacity-100" : "opacity-0"
          }`}
        >
          <BeanCanvas />
        </div>
      )}
    </div>
  );
}
