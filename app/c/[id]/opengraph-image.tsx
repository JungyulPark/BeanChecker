import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import { decodeShareId, type ShareCardData } from "@/lib/shareCard";

export const alt = `${BRAND.name} 공유카드`;
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

// 크림 라이트 전환 — globals.css @theme 및 shareCard/render.ts와 동일 값 유지
const COLOR = {
  roast950: "#EFE7DA",
  roast700: "#DCCDBA",
  crema100: "#2A1C12",
  crema400: "#6B5A48",
  amberGlow: "#8F5D14",
} as const;

const AXES: { key: keyof ShareCardData["profile"] }[] = [
  { key: "acidity" },
  { key: "sweetness" },
  { key: "body" },
  { key: "bitterness" },
  { key: "aftertaste" },
];

function point(cx: number, cy: number, r: number, i: number, total: number): [number, number] {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

/** 유니코드 ★(U+2605)는 Satori 기본 폰트에 글리프가 없어 깨진다 — 벡터로 직접 그린다. */
function StarIcon({ size: s = 44 }: { size?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24">
      <path
        fill={COLOR.amberGlow}
        d="M12 2l2.9 6.26 6.6.72-4.9 4.55 1.34 6.47L12 16.77 6.06 20l1.34-6.47L2.5 8.98l6.6-.72L12 2z"
      />
    </svg>
  );
}

/**
 * 로고타입 — FAMIMA 레퍼런스 캘리브레이션(투톤+언더라인)을 Satori 기본 폰트로 재현.
 * Space Grotesk를 여기서 쓰려면 런타임에 폰트 바이너리를 직접 fetch해야 해서(이 세션 네트워크
 * 제약상 불안정) 안전하게 기본 폰트를 쓰고 투톤+언더라인 장치만 이식했다. 정확한 서체 일치보다
 * 장치(두 색 분리 + 밑줄 바) 일관성이 우선 — components/Wordmark.tsx, lib/shareCard/render.ts와 동일 규칙.
 */
function WordmarkOg({ fontSize, underline }: { fontSize: number; underline: boolean }) {
  const mark = BRAND.wordmark.endsWith(".") ? BRAND.wordmark.slice(0, -1) : BRAND.wordmark;
  const dot = BRAND.wordmark.endsWith(".") ? "." : "";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ display: "flex", fontSize, fontWeight: 800, letterSpacing: 1 }}>
        <span style={{ color: COLOR.crema100 }}>{mark}</span>
        {dot && <span style={{ color: COLOR.amberGlow }}>{dot}</span>}
      </div>
      {underline && (
        <div
          style={{
            display: "flex",
            marginTop: fontSize * 0.14,
            width: "100%",
            height: Math.max(2, Math.round(fontSize * 0.06)),
            background: COLOR.amberGlow,
          }}
        />
      )}
    </div>
  );
}

function RadarSvg({ profile }: { profile: ShareCardData["profile"] }) {
  const size_ = 460;
  const cx = size_ / 2;
  const cy = size_ / 2;
  const r = size_ / 2 - 10;
  const n = AXES.length;

  const gridPoints = (scale: number) =>
    AXES.map((_, i) => point(cx, cy, r * scale, i, n).join(",")).join(" ");
  const valuePoints = AXES.map(({ key }, i) => {
    const v = Math.max(0, Math.min(10, profile[key]));
    return point(cx, cy, (r * v) / 10, i, n).join(",");
  }).join(" ");

  return (
    <svg width={size_} height={size_} viewBox={`0 0 ${size_} ${size_}`}>
      {[0.33, 0.66, 1].map((s) => (
        <polygon key={s} points={gridPoints(s)} fill="none" stroke={COLOR.roast700} strokeWidth={2} />
      ))}
      <polygon
        points={valuePoints}
        fill="rgba(217,142,50,0.12)"
        stroke={COLOR.amberGlow}
        strokeWidth={3}
      />
    </svg>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = decodeShareId(id);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: COLOR.roast950,
          }}
        >
          <WordmarkOg fontSize={64} underline />
        </div>
      ),
      size,
    );
  }

  const tagLabels = data.tags
    .map((t) => FLAVOR_TAGS.find((f) => f.id === t)?.label)
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `radial-gradient(circle at 50% 30%, #7A4A24 0%, ${COLOR.roast950} 70%)`,
          padding: 60,
        }}
      >
        <WordmarkOg fontSize={30} underline />
        <div style={{ display: "flex", marginTop: 28, fontSize: 26, color: COLOR.crema400 }}>
          {data.subLabel}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 12,
            fontSize: 56,
            fontWeight: 800,
            color: COLOR.crema100,
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          {data.beanName}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 24,
            fontSize: 44,
            color: COLOR.amberGlow,
            fontWeight: 700,
          }}
        >
          <StarIcon />
          {data.rating.toFixed(1)}
        </div>
        <div style={{ display: "flex", marginTop: 20 }}>
          <RadarSvg profile={data.profile} />
        </div>
        {tagLabels.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            {tagLabels.map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  border: `2px solid ${COLOR.amberGlow}`,
                  borderRadius: 999,
                  padding: "8px 20px",
                  color: COLOR.amberGlow,
                  fontSize: 24,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    size,
  );
}
