import { BRAND } from "@/lib/brand";

/**
 * 로고타입 (DESIGN_DIRECTION §2 워드마크 로고타입).
 * FAMIMA 리브랜딩 레퍼런스(사용자 제공, 2026-07)에서 캘리브레이션: 볼드 지오메트릭 서체 +
 * 워드마크 내 투톤 스플릿 + 언더라인 바. 색은 그린/시안 대신 우리 팔레트(crema/amber)로 번역.
 * "BEAN" 뒤 마침표만 amber-glow로 분리 — 국문 말장난("빈.")과도 맞물리는 지점이라 자연스러운 채택.
 */
export function Wordmark({
  size = "md",
  underline = true,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  underline?: boolean;
  className?: string;
}) {
  const textSize = { sm: "text-caption", md: "text-h2", lg: "text-display" }[size];
  const underlineHeight = { sm: "h-[2px]", md: "h-[3px]", lg: "h-1" }[size];

  const [mark, dot] = splitTrailingDot(BRAND.wordmark);

  return (
    <span className={`inline-flex flex-col items-center ${className}`}>
      <span
        className={`font-wordmark ${textSize} leading-none tracking-[0.02em] text-crema-100`}
      >
        {mark}
        {dot && <span className="text-amber-glow">{dot}</span>}
      </span>
      {underline && (
        <span className={`mt-1.5 w-full ${underlineHeight} bg-amber-glow`} aria-hidden />
      )}
    </span>
  );
}

function splitTrailingDot(wordmark: string): [string, string] {
  if (wordmark.endsWith(".")) {
    return [wordmark.slice(0, -1), "."];
  }
  return [wordmark, ""];
}
