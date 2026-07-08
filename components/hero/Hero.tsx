"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BRAND } from "@/lib/brand";
import { HeroBean } from "./HeroBean";

/**
 * 히어로 (DESIGN_DIRECTION §3): 심연 배경 위 원두 한 알. 스크롤 시 서서히 축소·페이드.
 */
export function Hero() {
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!stage.current) return;
      const t = Math.min(1, window.scrollY / (window.innerHeight * 0.7));
      stage.current.style.opacity = String(1 - t);
      stage.current.style.transform = `scale(${1 - t * 0.12})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative flex min-h-dvh flex-col items-center overflow-hidden px-6 pt-10 pb-16">
      <div className="bg-aura absolute inset-x-0 top-[8dvh] h-[70dvh] opacity-70" aria-hidden />

      <span className="relative text-caption tracking-[0.08em] text-crema-400">
        {BRAND.wordmark}
      </span>

      <div
        ref={stage}
        className="relative flex flex-1 flex-col items-center justify-center text-center will-change-transform"
      >
        <HeroBean />

        <h1 className="font-display mt-8 text-display text-crema-100">
          그 한 잔,
          <br />
          기억되게.
        </h1>
        <p className="mt-4 text-body text-crema-400">{BRAND.subline}</p>

        <Link
          href="/checkin"
          className="mt-10 rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950"
        >
          첫 잔 기록하기
        </Link>
      </div>
    </section>
  );
}
