"use client";

import type { FlavorProfile } from "@/types/domain";

const AXES: { key: keyof FlavorProfile; label: string }[] = [
  { key: "acidity", label: "산미" },
  { key: "sweetness", label: "단맛" },
  { key: "body", label: "바디" },
  { key: "bitterness", label: "쓴맛" },
  { key: "aftertaste", label: "여운" },
];

export const DEFAULT_PROFILE: FlavorProfile = {
  acidity: 5,
  sweetness: 5,
  body: 5,
  bitterness: 5,
  aftertaste: 5,
};

export function FlavorSliders({
  value,
  onChange,
}: {
  value: FlavorProfile;
  onChange: (v: FlavorProfile) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {AXES.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-body text-crema-400">{label}</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: Number(e.target.value) })}
            className="flavor-slider flex-1"
          />
          <span className="font-mono w-6 shrink-0 text-right text-body text-crema-100">
            {value[key]}
          </span>
        </label>
      ))}
    </div>
  );
}
