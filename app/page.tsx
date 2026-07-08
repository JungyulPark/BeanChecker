/**
 * 히어로 랜딩 자리 — 정식 히어로(360° 회전 원두)는 DESIGN_DIRECTION §3 스펙으로
 * 디자인 세션에서 구현 후 승인 게이트(프리뷰 스크린샷)를 거친다.
 * 이 페이지는 토큰 검증용 임시 플레이스홀더.
 */
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      <div className="bg-aura absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex flex-col items-center text-center">
        <span className="text-caption tracking-[0.08em] text-crema-400">
          VEANN
        </span>
        <h1 className="font-display mt-6 text-display text-crema-100">
          그 한 잔,
          <br />
          기억되게.
        </h1>
        <p className="mt-4 text-body text-crema-400">
          당신이 마신 원두가 당신의 취향이 된다
        </p>
        <a
          href="/checkin"
          className="mt-10 rounded-full bg-amber-glow px-8 py-3 text-body font-semibold text-roast-950"
        >
          첫 잔 기록하기
        </a>
      </div>
    </main>
  );
}
