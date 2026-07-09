import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/brand";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import { decodeShareId, type ShareCardData } from "@/lib/shareCard";

export const alt = `${BRAND.name} 공유카드`;
export const size = { width: 1080, height: 1080 };
export const contentType = "image/png";

const COLOR = {
  roast950: "#120C09",
  roast700: "#3B2A20",
  crema100: "#F1E7DB",
  crema400: "#B9A48F",
  amberGlow: "#D98E32",
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
            color: COLOR.crema100,
            fontSize: 48,
          }}
        >
          {BRAND.name}
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
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: COLOR.crema400, fontWeight: 700 }}>
          {BRAND.wordmark}
        </div>
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
