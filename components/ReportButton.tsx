"use client";

import { useState } from "react";
import { addReport, type ReportReason } from "@/lib/data/local";

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "wrong_info", label: "잘못된 정보" },
  { id: "spam", label: "스팸" },
  { id: "inappropriate_photo", label: "부적절한 사진" },
  { id: "defamation", label: "명예훼손" },
  { id: "other", label: "기타" },
];

/**
 * 신고/제보 — 시딩 데이터 정확도 유지 전략의 유저 사이드 절반 (PRODUCT.md §4, LAUNCH_CHECKLIST 리스크 로그).
 * "이 정보 틀렸어요"를 누구나 즉시 남길 수 있게 하고, /admin에서 처리한다.
 */
export function ReportButton({
  targetType,
  targetId,
  targetLabel,
}: {
  targetType: "checkin" | "bean" | "cafe";
  targetId: string;
  targetLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("wrong_info");
  const [memo, setMemo] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return <p className="text-caption text-crema-400">제보 접수됐어요. 확인 후 반영할게요.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-caption text-crema-400 underline underline-offset-2"
      >
        정보 오류 제보
      </button>
    );
  }

  return (
    <div className="glass-card p-3">
      <p className="mb-2 text-caption text-crema-400">무엇이 문제인가요?</p>
      <div className="flex flex-wrap gap-1.5">
        {REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setReason(r.id)}
            className={`rounded-full border px-3 py-1 text-caption ${
              reason === r.id
                ? "border-amber-glow bg-amber-glow text-roast-950"
                : "border-roast-700 text-crema-400"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value.slice(0, 140))}
        placeholder="자세히 알려주시면 도움이 돼요 (선택)"
        rows={2}
        className="mt-2 w-full rounded-card border border-roast-700 bg-roast-950 px-3 py-2 text-caption text-crema-100 placeholder:text-crema-400/60 focus:border-amber-glow focus:outline-none"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={async () => {
            await addReport({ targetType, targetId, targetLabel, reason, memo: memo || undefined });
            setDone(true);
          }}
          className="rounded-full bg-amber-glow px-4 py-1.5 text-caption font-semibold text-roast-950"
        >
          제출
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-roast-700 px-4 py-1.5 text-caption text-crema-400"
        >
          취소
        </button>
      </div>
    </div>
  );
}
