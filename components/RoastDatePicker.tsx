"use client";

import {
  ROAST_AGE_CHOICES,
  daysAgoDate,
  daysOffRoast,
  freshnessStage,
  FRESHNESS_COPY,
  roastAgeLabel,
} from "@/lib/freshness";

/**
 * 로스팅 시점 선택 — 칩 한 탭. 선택 안 하면 null(모름)이 기본이고, 그래도 기록은 완료된다.
 * 강제하지 않는 이유: 카페에서 마시면 봉투를 못 보는 경우가 대부분이다.
 * 강제하면 "모르는 값을 아무거나 찍는" 오염 데이터가 들어온다 — 빈 값이 낫다.
 */
export function RoastDatePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const days = daysOffRoast(value);
  const stage = days === null ? null : freshnessStage(days);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {ROAST_AGE_CHOICES.map((c) => {
          const selected = value !== null && days === c.days;
          return (
            <button
              key={c.days}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : daysAgoDate(c.days))}
              className={`pressable rounded-full border px-4 py-2 text-body ${
                selected
                  ? "border-amber-glow bg-amber-glow text-roast-950"
                  : "border-roast-700 text-crema-100"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {stage && days !== null ? (
        <p className="mt-2 text-caption text-crema-400">
          <span className="text-crema-100">{roastAgeLabel(days)}</span> ·{" "}
          {FRESHNESS_COPY[stage].label} — {FRESHNESS_COPY[stage].note}
        </p>
      ) : (
        <p className="mt-2 text-caption text-crema-400">
          봉투에 적힌 로스팅 날짜를 모르면 비워두세요
        </p>
      )}
    </div>
  );
}
