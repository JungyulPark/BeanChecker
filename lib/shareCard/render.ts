import { BRAND } from "@/lib/brand";
import { FLAVOR_TAGS } from "@/lib/flavorTags";
import type { ShareCardData } from "@/lib/shareCard";

/**
 * 클라이언트 Canvas 공유카드 렌더러 (TECHNICAL_SPEC §3 — 전환 엔진, 최우선 품질).
 * 다크 아우라 그라데이션 / 카페·원두명 / 별점 / 레이더 차트(5축) / 태그 칩 / 로고 + URL.
 * 사진은 카드에 넣지 않는다 — 스펙이 정의한 카드 구성 요소가 아니다(사진은 체크인 자체의 것).
 */

/**
 * 2026-08-13 크림 라이트 전환. 카드를 다크로 남기는 안도 검토했으나(스토리에서 드라마틱),
 * /c 랜딩이 크림이라 카드→랜딩 전환 순간(= 전환 퍼널의 핵심 지점)에 이질감이 생긴다.
 * 브랜드 일관성을 택했다. 값은 globals.css @theme와 동일 — 한쪽만 바뀌면 안 된다.
 */
const COLOR = {
  roast950: "#EFE7DA", // 카드 바탕(크림)
  roast900: "#FDFAF4", // 내부 서피스
  roast700: "#C9B69C", // 레이더 격자 (크림 위 가독 확보 — UI 보더보다 진하게)
  crema100: "#2A1C12", // 주 텍스트
  crema400: "#6B5A48", // 보조 텍스트
  amberGlow: "#8F5D14", // 액센트(별점·레이더 스트로크)
  aura: "rgba(217,162,78,0.30)", // 상단 햇살 글로우 (크림에선 약하게 — 강하면 텍스트가 씻긴다)
} as const;

const AXES: { key: keyof ShareCardData["profile"]; label: string }[] = [
  { key: "acidity", label: "산미" },
  { key: "sweetness", label: "단맛" },
  { key: "body", label: "바디" },
  { key: "bitterness", label: "쓴맛" },
  { key: "aftertaste", label: "여운" },
];

export type ShareCardAspect = "story" | "square";

const SIZES: Record<ShareCardAspect, { w: number; h: number }> = {
  story: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

function fontFamily(cssVar: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  return v || fallback;
}

/** 캔버스 텍스트는 이미 로드된 폰트만 정확히 그린다 — 그리기 전 명시적으로 로드해 대기. */
export async function preloadShareCardFonts(): Promise<{
  display: string;
  mono: string;
  body: string;
  wordmark: string;
}> {
  const display = fontFamily("--font-nanum-myeongjo", "serif");
  const mono = fontFamily("--font-jetbrains-mono", "monospace");
  const body = "Pretendard Variable, Pretendard, sans-serif";
  const wordmark = fontFamily("--font-space-grotesk", "sans-serif");

  const specs = [
    `800 88px ${display}`,
    `700 40px ${mono}`,
    `600 30px ${body}`,
    `500 26px ${body}`,
    `400 24px ${body}`,
    `700 40px ${wordmark}`,
  ];
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => undefined)));
  await document.fonts.ready;
  return { display, mono, body, wordmark };
}

/**
 * 로고타입 — FAMIMA 레퍼런스 캘리브레이션(볼드 지오메트릭+투톤+언더라인)을 우리 팔레트로 번역.
 * "BEAN" 뒤 마침표만 amber-glow로 분리. components/Wordmark.tsx와 동일 규칙(DESIGN_DIRECTION §2).
 */
function drawWordmark(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  fontPx: number,
  wordmarkFont: string,
  underline: boolean,
) {
  const mark = BRAND.wordmark.endsWith(".") ? BRAND.wordmark.slice(0, -1) : BRAND.wordmark;
  const dot = BRAND.wordmark.endsWith(".") ? "." : "";

  ctx.font = `700 ${fontPx}px ${wordmarkFont}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const markW = ctx.measureText(mark).width;
  const dotW = dot ? ctx.measureText(dot).width : 0;
  const totalW = markW + dotW;
  const startX = cx - totalW / 2;

  ctx.fillStyle = COLOR.crema100;
  ctx.fillText(mark, startX, y);
  if (dot) {
    ctx.fillStyle = COLOR.amberGlow;
    ctx.fillText(dot, startX + markW, y);
  }

  if (underline) {
    const barY = y + fontPx * 0.28;
    ctx.fillStyle = COLOR.amberGlow;
    ctx.fillRect(startX, barY, totalW, Math.max(2, Math.round(fontPx * 0.05)));
  }
  ctx.textAlign = "center";
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 긴 원두명을 최대 2줄로 감싼다. 반환값: 실제 그려진 줄 수. */
function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
    if (lines.length === maxLines - 1) break;
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) lines.length = maxLines;

  lines.forEach((line, i) => ctx.fillText(line, cx, y + i * lineHeight));
  return lines.length;
}

function point(cx: number, cy: number, r: number, i: number, total: number): [number, number] {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  profile: ShareCardData["profile"],
  bodyFont: string,
  compact: boolean,
) {
  const n = AXES.length;
  ctx.strokeStyle = COLOR.roast700;
  ctx.lineWidth = 2;
  for (const scale of [0.33, 0.66, 1]) {
    ctx.beginPath();
    AXES.forEach((_, i) => {
      const [x, y] = point(cx, cy, r * scale, i, n);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  AXES.forEach((_, i) => {
    const [x, y] = point(cx, cy, r, i, n);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  });

  ctx.beginPath();
  AXES.forEach(({ key }, i) => {
    const value = Math.max(0, Math.min(10, profile[key]));
    const [x, y] = point(cx, cy, (r * value) / 10, i, n);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(143, 93, 20, 0.14)"; // amberGlow 알파 — 크림 위 형태가 읽히는 최소치
  ctx.fill();
  ctx.strokeStyle = COLOR.amberGlow;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = `500 ${compact ? 20 : 26}px ${bodyFont}`;
  ctx.fillStyle = COLOR.crema400;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  AXES.forEach(({ label }, i) => {
    const [x, y] = point(cx, cy, r + (compact ? 32 : 44), i, n);
    ctx.fillText(label, x, y);
  });
}

export async function renderShareCard(
  canvas: HTMLCanvasElement,
  data: ShareCardData,
  aspect: ShareCardAspect,
  shareUrl: string,
): Promise<void> {
  const { w, h } = SIZES[aspect];
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");

  const { display, mono, body, wordmark } = await preloadShareCardFonts();

  // 배경
  ctx.fillStyle = COLOR.roast950;
  ctx.fillRect(0, 0, w, h);

  // 아우라
  const auraCy = aspect === "story" ? h * 0.32 : h * 0.28;
  const auraR = w * 0.85;
  const gradient = ctx.createRadialGradient(w / 2, auraCy, 0, w / 2, auraCy, auraR);
  gradient.addColorStop(0, COLOR.aura);
  gradient.addColorStop(1, "rgba(217,162,78,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;

  // 정사각형은 세로 공간이 스토리의 56%뿐 — 폰트 크기·간격을 별도로 잡는다 (겹침 방지).
  // startY는 콘텐츠 블록을 세로 중앙에 앉히는 값 (2026-08-13 조정). 스토리는 인스타 UI가
  // 상·하단 약 250px를 덮으므로 중앙 배치가 곧 안전영역 배치다.
  const L =
    aspect === "story"
      ? { startY: 300, wordmark: 28, gapSub: 90, sub: 30, gapTitle: 76, title: 76, titleLine: 86, gapRating: 90, rating: 56, radarR: 300, gapRadar: 130, gapChip: 90, chip: 30, gapLogo: 70, gapUrl: 40, logo: 26, url: 24 }
      : { startY: 125, wordmark: 24, gapSub: 56, sub: 26, gapTitle: 54, title: 58, titleLine: 66, gapRating: 54, rating: 40, radarR: 190, gapRadar: 76, gapChip: 76, chip: 24, gapLogo: 60, gapUrl: 34, logo: 22, url: 18 };

  let y = L.startY;

  // 워드마크 (투톤 + 언더라인 — 카드의 첫인상, 풀 로고타입 처리)
  drawWordmark(ctx, cx, y, L.wordmark, wordmark, true);

  // 서브라벨 (카페명/홈브루)
  y += L.gapSub;
  ctx.font = `500 ${L.sub}px ${body}`;
  ctx.fillStyle = COLOR.crema400;
  ctx.fillText(data.subLabel, cx, y);

  // 원두명 (디스플레이 폰트, 최대 2줄)
  y += L.gapTitle;
  ctx.font = `800 ${L.title}px ${display}`;
  ctx.fillStyle = COLOR.crema100;
  const lines = wrapCenteredText(ctx, data.beanName, cx, y, w * 0.82, L.titleLine, 2);
  y += (lines - 1) * L.titleLine;

  // 별점
  y += L.gapRating;
  ctx.font = `700 ${L.rating}px ${mono}`;
  ctx.fillStyle = COLOR.amberGlow;
  ctx.fillText(`★ ${data.rating.toFixed(1)}`, cx, y);

  // 레이더
  const radarR = L.radarR;
  const radarCy = y + radarR + L.gapRadar;
  drawRadar(ctx, cx, radarCy, radarR, data.profile, body, aspect === "square");

  // 태그 칩 — 실제 콘텐츠 흐름에 이어 그린다 (하단 고정 좌표가 아님 → 겹침 방지)
  let contentBottom = radarCy + radarR;
  const chipY = radarCy + radarR + L.gapChip;
  const labels = data.tags
    .map((t) => FLAVOR_TAGS.find((f) => f.id === t)?.label)
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const chipH = aspect === "story" ? 56 : 44;
  if (labels.length > 0) {
    ctx.font = `600 ${L.chip}px ${body}`;
    const paddingX = aspect === "story" ? 28 : 22;
    const gap = 16;
    const widths = labels.map((l) => ctx.measureText(l).width + paddingX * 2);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
    let chipX = cx - totalW / 2;
    labels.forEach((label, i) => {
      const cw = widths[i];
      ctx.strokeStyle = COLOR.amberGlow;
      ctx.lineWidth = 2;
      roundedRect(ctx, chipX, chipY, cw, chipH, chipH / 2);
      ctx.stroke();
      ctx.fillStyle = COLOR.amberGlow;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(label, chipX + cw / 2, chipY + chipH / 2 + 2);
      chipX += cw + gap;
    });
    contentBottom = chipY + chipH;
  }

  // 하단 로고 + URL — 콘텐츠 끝에 이어 배치 (풋터는 언더라인 없이 미니멀하게)
  drawWordmark(ctx, cx, contentBottom + L.gapLogo, L.logo, wordmark, false);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 ${L.url}px ${mono}`;
  ctx.fillStyle = COLOR.crema400;
  ctx.fillText(shortenUrlForDisplay(shareUrl), cx, contentBottom + L.gapLogo + L.gapUrl);
}

/**
 * 카드에 박히는 텍스트는 짧아야 한다 — 실제 공유 링크(Web Share/카톡 복사)는 항상 전체 URL을 쓰고,
 * 카드 위 표시만 축약한다. id가 지금은 인코딩된 데이터 블롭이라 길다(lib/shareCard.ts 상단 주석 참조);
 * Supabase 연결 후 짧은 uuid로 바뀌면 이 축약 자체가 불필요해진다.
 */
function shortenUrlForDisplay(url: string): string {
  try {
    const u = new URL(url);
    const id = u.pathname.split("/").pop() ?? "";
    const shortId = id.length > 10 ? `${id.slice(0, 10)}…` : id;
    return `${u.host}${u.pathname.replace(id, shortId)}`;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png", 0.95);
  });
}
