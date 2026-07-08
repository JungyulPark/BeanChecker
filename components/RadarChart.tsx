import type { FlavorProfile } from "@/types/domain";

/**
 * 향미 레이더 차트 — 브랜드 시각 자산 (DESIGN_DIRECTION §2 형태):
 * amber-glow 스트로크 1.5px + 내부 12% 채움. 앱/공유카드/SEO 페이지 전부 이 컴포넌트 스타일.
 */
const AXES: { key: keyof FlavorProfile; label: string }[] = [
  { key: "acidity", label: "산미" },
  { key: "sweetness", label: "단맛" },
  { key: "body", label: "바디" },
  { key: "bitterness", label: "쓴맛" },
  { key: "aftertaste", label: "여운" },
];

function point(center: number, radius: number, i: number, total: number) {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  return [center + radius * Math.cos(angle), center + radius * Math.sin(angle)];
}

export function RadarChart({
  profile,
  size = 220,
  showLabels = true,
}: {
  profile: FlavorProfile;
  size?: number;
  showLabels?: boolean;
}) {
  const c = size / 2;
  const r = size / 2 - (showLabels ? 28 : 6);
  const n = AXES.length;

  const gridLevels = [0.33, 0.66, 1];
  const gridPolygon = (scale: number) =>
    AXES.map((_, i) => point(c, r * scale, i, n).join(",")).join(" ");

  const valuePolygon = AXES.map(({ key }, i) =>
    point(c, (r * Math.max(0, Math.min(10, profile[key]))) / 10, i, n).join(","),
  ).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label="향미 프로필 레이더 차트"
    >
      {gridLevels.map((s) => (
        <polygon
          key={s}
          points={gridPolygon(s)}
          fill="none"
          stroke="var(--color-roast-700)"
          strokeWidth={1}
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(c, r, i, n);
        return (
          <line
            key={i}
            x1={c}
            y1={c}
            x2={x}
            y2={y}
            stroke="var(--color-roast-700)"
            strokeWidth={1}
          />
        );
      })}
      <polygon
        points={valuePolygon}
        fill="var(--color-amber-glow)"
        fillOpacity={0.12}
        stroke="var(--color-amber-glow)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {showLabels &&
        AXES.map(({ label }, i) => {
          const [x, y] = point(c, r + 16, i, n);
          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-crema-400)"
              fontSize={12}
            >
              {label}
            </text>
          );
        })}
    </svg>
  );
}
