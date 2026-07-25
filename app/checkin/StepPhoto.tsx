"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { resizePhoto, blobToDataUrl } from "@/lib/image";

/**
 * 스텝2: 사진. 클라이언트 리사이즈(1440px/JPEG 0.8)로 EXIF 자연 제거.
 * 홈브루 전환 시 사진 가이드가 바뀐다 (TECHNICAL_SPEC §3).
 */
export function StepPhoto({
  context,
  photoDataUrl,
  onPhoto,
  onNext,
}: {
  context: "cafe" | "home";
  photoDataUrl: string | null;
  onPhoto: (dataUrl: string) => void;
  onNext: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await resizePhoto(file);
      onPhoto(await blobToDataUrl(blob));
    } catch {
      setError("사진 처리에 실패했어요. 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="glass-card relative flex aspect-square w-full items-center justify-center overflow-hidden border-dashed"
      >
        {photoDataUrl ? (
          <Image
            src={photoDataUrl}
            alt="체크인 사진 미리보기"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className="px-6 text-center text-body text-crema-400">
            {busy
              ? "사진 처리 중…"
              : context === "home"
                ? "탭해서 촬영 — 드리퍼·컵 등 브루잉 장면이 보이면 좋아요"
                : "탭해서 촬영 — 잔과 원두 패키지가 보이면 좋아요"}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <p className="text-caption text-crema-400">
        {photoDataUrl
          ? "다른 손님의 얼굴이 나오지 않게 찍어주세요."
          : "사진은 선택이에요 — 없어도 기록은 남습니다. 있으면 공유카드가 예뻐져요."}
      </p>
      {error && <p className="text-caption text-amber-glow">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={onNext}
        className="mt-2 pressable rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950 disabled:opacity-40"
      >
        {photoDataUrl ? "다음" : "사진 없이 계속"}
      </button>
    </div>
  );
}
