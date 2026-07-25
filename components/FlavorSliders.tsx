"use client";

import type { FlavorProfile } from "@/types/domain";

const AXES: { key: keyof FlavorProfile; label: string }[] = [
  { key: "acidity", label: "산미" },
  { key: "sweetness", label: "단맛" },
  { key: "body", label: "바디" },
  { key: "bitterness", label: "쓴맛" },
  { key: "aftertaste", label: "여운" },
];

/**
 * 미평가 상태 = null. 예전엔 전 축이 5로 시작해서, 슬라이더를 건드리지 않아도
 * "전부 보통"이라는 가짜 프로필이 저장됐다 — 우리 해자인 향미 DB를 우리가 오염시키는 구조였다.
 * 이제 손대지 않은 축은 null로 남고, 5축을 다 평가해야 기록이 완료된다 (StepRate.valid).
 */
export type DraftFlavorProfile = Record<keyof FlavorProfile, number | null>;

export const EMPTY_PROFILE: DraftFlavorProfile = {
  acidity: null,
  sweetness: null,
  body: null,
  bitterness: null,
  aftertaste: null,
};

/** 5축이 모두 평가됐을 때만 완성된 프로필로 승격 */
export function toFlavorProfile(draft: DraftFlavorProfile): FlavorProfile | null {
  const entries = AXES.map(({ key }) => [key, draft[key]] as const);
  if (entries.some(([, v]) => v === null)) return null;
  return Object.fromEntries(entries) as unknown as FlavorProfile;
}

export function ratedAxisCount(draft: DraftFlavorProfile): number {
  return AXES.filter(({ key }) => draft[key] !== null).length;
}

export function FlavorSliders({
  value,
  onChange,
}: {
  value: DraftFlavorProfile;
  onChange: (v: DraftFlavorProfile) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {AXES.map(({ key, label }) => {
        const rated = value[key] !== null;
        return (
          <label key={key} className="flex items-center gap-3">
            <span
              className={`w-10 shrink-0 text-body ${rated ? "text-crema-100" : "text-crema-400"}`}
            >
              {label}
            </span>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              // 미평가 상태에서도 thumb 위치는 중앙에 두되, 값은 저장하지 않는다
              value={value[key] ?? 5}
              aria-valuetext={rated ? String(value[key]) : "미평가"}
              onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
              // 정확히 5(중앙)를 고르면 value가 안 바뀌어 change가 안 뜬다 —
              // 조작을 시작한 순간 현재 값으로 확정해서 "보통"도 평가로 잡히게 한다
              onPointerDown={() => {
                if (!rated) onChange({ ...value, [key]: 5 });
              }}
              onKeyDown={() => {
                if (!rated) onChange({ ...value, [key]: 5 });
              }}
              className={`flavor-slider flex-1 ${rated ? "" : "opacity-45"}`}
            />
            <span
              className={`font-mono w-6 shrink-0 text-right text-body ${
                rated ? "text-crema-100" : "text-crema-400"
              }`}
            >
              {rated ? value[key] : "–"}
            </span>
          </label>
        );
      })}
    </div>
  );
}
