"use client";

import { useEffect, useRef, useState } from "react";
import { BRAND } from "@/lib/brand";
import { encodeShareId, type ShareCardData } from "@/lib/shareCard";
import { canvasToBlob, renderShareCard, type ShareCardAspect } from "@/lib/shareCard/render";

/**
 * 공유 시트 (TECHNICAL_SPEC §3 공유 우선순위):
 * ①Web Share API Level 2(files) ②미지원 시 이미지 저장 + 카톡용 텍스트 복사
 * ③인스타 스토리는 "저장 후 업로드" 2탭 가이드가 공식 플로우.
 */
export function ShareSheet({ data }: { data: ShareCardData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspect, setAspect] = useState<ShareCardAspect>("story");
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [canWebShareFiles, setCanWebShareFiles] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/c/${encodeShareId(data)}`
      : "";

  useEffect(() => {
    if (typeof navigator !== "undefined" && "canShare" in navigator) {
      try {
        setCanWebShareFiles(
          navigator.canShare?.({ files: [new File([], "card.png", { type: "image/png" })] }) ?? false,
        );
      } catch {
        setCanWebShareFiles(false);
      }
    }
  }, []);

  useEffect(() => {
    setReady(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderShareCard(canvas, data, aspect, shareUrl).then(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect]);

  const caption = `${data.subLabel} · ${data.beanName} ★${data.rating.toFixed(1)}\n${shareUrl}`;

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], `${BRAND.name}-card.png`, { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: BRAND.name, text: caption });
        return;
      } catch {
        // 사용자가 취소한 경우 등 — 폴백으로 진행하지 않고 조용히 종료
        return;
      }
    }
    await handleSaveImage();
  };

  const handleSaveImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = await canvasToBlob(canvas);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${BRAND.name}-card.png`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("이미지를 저장했어요. 인스타 스토리엔 저장한 이미지를 업로드해주세요.");
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setStatus("카톡에 붙여넣을 텍스트를 복사했어요.");
    } catch {
      setStatus("복사에 실패했어요 — 직접 선택해 복사해주세요.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-2">
        {(["story", "square"] as const).map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAspect(a)}
            className={`rounded-full border px-4 py-1.5 text-caption ${
              aspect === a
                ? "border-amber-glow bg-amber-glow text-roast-950"
                : "border-roast-700 text-crema-400"
            }`}
          >
            {a === "story" ? "9:16 스토리" : "1:1 정사각"}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[280px] overflow-hidden glass-card">
        <canvas
          ref={canvasRef}
          className={`w-full ${aspect === "story" ? "aspect-[9/16]" : "aspect-square"} ${
            ready ? "opacity-100" : "opacity-0"
          } transition-opacity`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950"
        >
          {canWebShareFiles ? "공유하기" : "이미지 저장"}
        </button>
        {canWebShareFiles && (
          <button
            type="button"
            onClick={handleSaveImage}
            className="rounded-full border border-roast-700 px-8 py-3 text-body text-crema-100"
          >
            이미지로 저장
          </button>
        )}
        <button
          type="button"
          onClick={handleCopyCaption}
          className="rounded-full border border-roast-700 px-8 py-3 text-body text-crema-100"
        >
          카톡용 텍스트 복사
        </button>
      </div>

      <p className="text-center text-caption text-crema-400">
        인스타 스토리는 저장한 이미지를 업로드해주세요 (공유 → 저장 → 스토리에 추가, 2탭)
      </p>
      {status && <p className="text-center text-caption text-amber-glow">{status}</p>}
    </div>
  );
}
