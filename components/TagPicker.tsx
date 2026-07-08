"use client";

import {
  FLAVOR_TAG_GROUPS,
  MAX_FLAVOR_TAGS_PER_CHECKIN,
  type FlavorTagId,
} from "@/lib/flavorTags";

export function TagPicker({
  selected,
  onChange,
}: {
  selected: FlavorTagId[];
  onChange: (tags: FlavorTagId[]) => void;
}) {
  const toggle = (id: FlavorTagId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((t) => t !== id));
    } else if (selected.length < MAX_FLAVOR_TAGS_PER_CHECKIN) {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {FLAVOR_TAG_GROUPS.map((group) => (
        <div key={group.group}>
          <p className="mb-1.5 text-caption text-crema-400">{group.label}</p>
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag) => {
              const active = selected.includes(tag.id);
              const full =
                !active && selected.length >= MAX_FLAVOR_TAGS_PER_CHECKIN;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  disabled={full}
                  className={`rounded-full border px-3.5 py-1.5 text-body transition-colors ${
                    active
                      ? "border-amber-glow bg-amber-glow text-roast-950"
                      : "border-roast-700 text-crema-100"
                  } ${full ? "opacity-40" : ""}`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-caption text-crema-400">
        {selected.length}/{MAX_FLAVOR_TAGS_PER_CHECKIN}개 선택
      </p>
    </div>
  );
}
