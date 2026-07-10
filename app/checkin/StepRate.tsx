"use client";

import { useMemo, useState } from "react";
import { StarRating } from "@/components/StarRating";
import { FlavorSliders, DEFAULT_PROFILE } from "@/components/FlavorSliders";
import { TagPicker } from "@/components/TagPicker";
import { MOCK_BEANS, type MockBean } from "@/lib/mock/seed";
import type { FlavorProfile } from "@/types/domain";
import type { FlavorTagId } from "@/lib/flavorTags";

const BREW_METHODS = [
  { id: "espresso", label: "에스프레소" },
  { id: "filter", label: "필터" },
  { id: "other", label: "그 외" },
] as const;

const ORIGINS = [
  { id: "ethiopia", label: "에티오피아" },
  { id: "colombia", label: "콜롬비아" },
  { id: "kenya", label: "케냐" },
  { id: "brazil", label: "브라질" },
  { id: "guatemala", label: "과테말라" },
  { id: "panama", label: "파나마" },
  { id: "other", label: "기타" },
] as const;

export type RateResult = {
  bean: { id: string; name: string; roasterName: string | null };
  brewMethod: "espresso" | "filter" | "other";
  rating: number;
  profile: FlavorProfile;
  flavorTags: FlavorTagId[];
  memo: string;
  isPublic: boolean;
};

function normalize(name: string) {
  return name.toLowerCase().replace(/[\s\-_.]/g, "");
}

/**
 * 스텝3: 원두 선택(검색 우선, 없을 때만 신규 등록 2필드 — 중복 방지) + 평가.
 */
export function StepRate({ onSubmit }: { onSubmit: (r: RateResult) => void }) {
  const [beanQuery, setBeanQuery] = useState("");
  const [bean, setBean] = useState<RateResult["bean"] | null>(null);
  const [registering, setRegistering] = useState(false);
  const [newOrigin, setNewOrigin] = useState<string>("ethiopia");

  const [brewMethod, setBrewMethod] = useState<RateResult["brewMethod"]>("filter");
  const [rating, setRating] = useState(0);
  const [profile, setProfile] = useState<FlavorProfile>(DEFAULT_PROFILE);
  const [tags, setTags] = useState<FlavorTagId[]>([]);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const matches = useMemo(() => {
    if (!beanQuery) return MOCK_BEANS;
    const q = normalize(beanQuery);
    return MOCK_BEANS.filter((b) => b.normalizedName.includes(q));
  }, [beanQuery]);

  const exactDup = useMemo(
    () => MOCK_BEANS.find((b) => b.normalizedName === normalize(beanQuery)),
    [beanQuery],
  );

  const selectBean = (b: MockBean) => {
    setBean({ id: b.id, name: b.name, roasterName: b.roasterName });
    setRegistering(false);
  };

  const registerBean = () => {
    setBean({
      id: `local-${normalize(beanQuery)}-${newOrigin}`,
      name: beanQuery.trim(),
      roasterName: null,
    });
    setRegistering(false);
  };

  const valid = bean !== null && rating > 0 && tags.length >= 1;

  return (
    <div className="flex flex-col gap-7">
      {/* 원두 선택 */}
      <section>
        <h2 className="mb-2 text-body font-semibold text-crema-100">원두</h2>
        {bean ? (
          <div className="flex items-center justify-between rounded-card border border-amber-glow/50 bg-roast-900 px-4 py-3">
            <span>
              <span className="block text-body font-semibold text-crema-100">
                {bean.name}
              </span>
              {bean.roasterName && (
                <span className="block text-caption text-crema-400">
                  {bean.roasterName}
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={() => setBean(null)}
              className="text-caption text-crema-400 underline underline-offset-2"
            >
              변경
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="search"
              value={beanQuery}
              onChange={(e) => {
                setBeanQuery(e.target.value);
                setRegistering(false);
              }}
              placeholder="원두 이름 검색"
              className="w-full glass-card px-4 py-3 text-body text-crema-100 placeholder:text-crema-400/60 focus:border-amber-glow focus:outline-none"
            />
            <ul className="flex flex-col gap-1.5">
              {matches.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => selectBean(b)}
                    className="flex w-full items-center justify-between glass-card px-4 py-2.5 text-left"
                  >
                    <span className="text-body text-crema-100">{b.name}</span>
                    <span className="text-caption text-crema-400">
                      {b.roasterName}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {beanQuery.trim().length >= 2 && !exactDup && !registering && (
              <button
                type="button"
                onClick={() => setRegistering(true)}
                className="glass-card border-dashed px-4 py-2.5 text-body text-crema-400"
              >
                &ldquo;{beanQuery.trim()}&rdquo; 새 원두로 등록
              </button>
            )}
            {registering && (
              <div className="flex items-center gap-2 glass-card p-3">
                <select
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="flex-1 rounded-card border border-roast-700 bg-roast-950 px-3 py-2 text-body text-crema-100"
                >
                  {ORIGINS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={registerBean}
                  className="rounded-full bg-amber-glow px-4 py-2 text-body font-semibold text-roast-950"
                >
                  등록
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 추출 방식 */}
      <section>
        <h2 className="mb-2 text-body font-semibold text-crema-100">추출</h2>
        <div className="flex gap-2">
          {BREW_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setBrewMethod(m.id)}
              className={`rounded-full border px-4 py-2 text-body ${
                brewMethod === m.id
                  ? "border-amber-glow bg-amber-glow text-roast-950"
                  : "border-roast-700 text-crema-100"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* 별점 */}
      <section>
        <h2 className="mb-2 text-body font-semibold text-crema-100">별점</h2>
        <StarRating value={rating} onChange={setRating} />
      </section>

      {/* 5축 슬라이더 */}
      <section>
        <h2 className="mb-3 text-body font-semibold text-crema-100">향미 프로필</h2>
        <FlavorSliders value={profile} onChange={setProfile} />
      </section>

      {/* 태그 */}
      <section>
        <h2 className="mb-3 text-body font-semibold text-crema-100">
          향미 태그 <span className="font-normal text-crema-400">(최대 3개)</span>
        </h2>
        <TagPicker selected={tags} onChange={setTags} />
      </section>

      {/* 메모 (유일한 자유 텍스트 — 2차 UX) */}
      <section>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, 140))}
          placeholder="메모 (선택, 140자)"
          rows={2}
          className="w-full glass-card px-4 py-3 text-body text-crema-100 placeholder:text-crema-400/60 focus:border-amber-glow focus:outline-none"
        />
        <label className="mt-1 flex items-center gap-2 text-body text-crema-400">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-amber-glow)]"
          />
          공개 체크인
        </label>
      </section>

      <button
        type="button"
        disabled={!valid}
        onClick={() =>
          bean &&
          onSubmit({ bean, brewMethod, rating, profile, flavorTags: tags, memo, isPublic })
        }
        className="rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950 disabled:opacity-40"
      >
        기록 완료
      </button>
    </div>
  );
}
