"use client";

import { useMemo, useState } from "react";
import { StarRating } from "@/components/StarRating";
import {
  FlavorSliders,
  EMPTY_PROFILE,
  ratedAxisCount,
  toFlavorProfile,
  type DraftFlavorProfile,
} from "@/components/FlavorSliders";
import { TagPicker } from "@/components/TagPicker";
import { RoastDatePicker } from "@/components/RoastDatePicker";
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
  bean: {
    id: string;
    name: string;
    roasterName: string | null;
    origin: string;
    slug: string | null; // null = 즉석 등록 (아직 카탈로그에 없는 원두)
  };
  brewMethod: "espresso" | "filter" | "other";
  rating: number;
  profile: FlavorProfile;
  flavorTags: FlavorTagId[];
  roastDate: string | null; // 선택 — 모르면 null (강제하면 오염 데이터가 들어온다)
  memo: string;
  isPublic: boolean;
};

function normalize(name: string) {
  return name.toLowerCase().replace(/[\s\-_.]/g, "");
}

/**
 * 스텝3: 원두 선택(검색 우선, 없을 때만 신규 등록 2필드 — 중복 방지) + 평가.
 *
 * cafeId가 있으면 그 로스터리의 원두를 검색 전에 먼저 보여준다 —
 * 실제 장면("카운터 앞에서 오늘의 원두를 고른다")에서 타이핑을 없애는 게 핵심 (P6).
 */
export function StepRate({
  cafeId,
  cafeName,
  onSubmit,
}: {
  cafeId?: string | null;
  cafeName?: string | null;
  onSubmit: (r: RateResult) => void;
}) {
  const [beanQuery, setBeanQuery] = useState("");
  const [bean, setBean] = useState<RateResult["bean"] | null>(null);
  const [registering, setRegistering] = useState(false);
  const [newOrigin, setNewOrigin] = useState<string>("ethiopia");

  const [brewMethod, setBrewMethod] = useState<RateResult["brewMethod"]>("filter");
  const [rating, setRating] = useState(0);
  const [profile, setProfile] = useState<DraftFlavorProfile>(EMPTY_PROFILE);
  const [tags, setTags] = useState<FlavorTagId[]>([]);
  const [roastDate, setRoastDate] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // 이 카페(로스터리)의 원두 — 검색 없이 바로 고를 수 있는 기본 선택지
  const cafeBeans = useMemo(
    () => (cafeId ? MOCK_BEANS.filter((b) => b.roasterId === cafeId) : []),
    [cafeId],
  );

  const matches = useMemo(() => {
    if (!beanQuery) {
      // 검색 전에는 이 카페 원두를 위로, 나머지는 아래로
      const rest = MOCK_BEANS.filter((b) => !cafeBeans.includes(b));
      return [...cafeBeans, ...rest];
    }
    const q = normalize(beanQuery);
    return MOCK_BEANS.filter((b) => b.normalizedName.includes(q));
  }, [beanQuery, cafeBeans]);

  const exactDup = useMemo(
    () => MOCK_BEANS.find((b) => b.normalizedName === normalize(beanQuery)),
    [beanQuery],
  );

  const selectBean = (b: MockBean) => {
    setBean({ id: b.id, name: b.name, roasterName: b.roasterName, origin: b.origin, slug: b.slug });
    setRegistering(false);
  };

  const registerBean = () => {
    setBean({
      id: `local-${normalize(beanQuery)}-${newOrigin}`,
      name: beanQuery.trim(),
      roasterName: null,
      origin: newOrigin,
      slug: null,
    });
    setRegistering(false);
  };

  const showCafeBeans = cafeBeans.length > 0 && !beanQuery;
  const completeProfile = toFlavorProfile(profile);
  const ratedAxes = ratedAxisCount(profile);
  const valid =
    bean !== null && rating > 0 && tags.length >= 1 && completeProfile !== null;

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
            {/* 이 카페의 원두 — 검색 전 기본 선택지 (타이핑 없이 한 탭) */}
            {showCafeBeans && (
              <>
                <p className="text-caption text-crema-400">
                  {cafeName ? `${cafeName}의 원두` : "이 카페의 원두"}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {cafeBeans.map((b) => (
                    <li key={b.id}>
                      <button
                        type="button"
                        onClick={() => selectBean(b)}
                        className="flex w-full items-center justify-between glass-card pressable border-amber-glow/40 px-4 py-2.5 text-left"
                      >
                        <span className="text-body text-crema-100">{b.name}</span>
                        <span className="shrink-0 text-caption text-crema-400">
                          {b.originKo}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-caption text-crema-400">
                  찾는 원두가 없나요? 아래에서 검색하세요
                </p>
              </>
            )}
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
              {(showCafeBeans
                ? matches.filter((b) => !cafeBeans.includes(b))
                : matches
              )
                .slice(0, 5)
                .map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      onClick={() => selectBean(b)}
                      className="flex w-full items-center justify-between glass-card pressable px-4 py-2.5 text-left"
                    >
                      <span className="text-body text-crema-100">{b.name}</span>
                      <span className="shrink-0 text-caption text-crema-400">
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
                  className="pressable rounded-full bg-amber-glow px-4 py-2 text-body font-semibold text-roast-950"
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

      {/* 로스팅 시점 — 선택. 스페셜티에서 신선도는 원산지만큼 큰 변수다 (lib/freshness.ts) */}
      <section>
        <h2 className="mb-2 text-body font-semibold text-crema-100">
          로스팅 <span className="font-normal text-crema-400">(선택)</span>
        </h2>
        <RoastDatePicker value={roastDate} onChange={setRoastDate} />
      </section>

      {/* 별점 */}
      <section>
        <h2 className="mb-2 text-body font-semibold text-crema-100">별점</h2>
        <StarRating value={rating} onChange={setRating} />
      </section>

      {/* 5축 슬라이더 — 손대지 않은 축은 "–"(미평가). 5축을 다 평가해야 기록 완료 */}
      <section>
        <h2 className="mb-1 text-body font-semibold text-crema-100">
          향미 프로필{" "}
          <span className="font-mono font-normal text-crema-400">
            {ratedAxes}/5
          </span>
        </h2>
        <p className="mb-3 text-caption text-crema-400">
          슬라이더를 움직여 평가하세요 — 이 다섯 축이 당신의 취향 레이더가 됩니다
        </p>
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

      <div className="flex flex-col gap-2">
        {!valid && (
          <p className="text-caption text-crema-400">
            {bean === null
              ? "원두를 선택하면 기록할 수 있어요"
              : rating === 0
                ? "별점을 남겨주세요"
                : completeProfile === null
                  ? `향미 5축을 모두 평가해주세요 (${ratedAxes}/5)`
                  : "향미 태그를 1개 이상 골라주세요"}
          </p>
        )}
        <button
          type="button"
          disabled={!valid}
          onClick={() =>
            bean &&
            completeProfile &&
            onSubmit({
              bean,
              brewMethod,
              rating,
              profile: completeProfile,
              flavorTags: tags,
              roastDate,
              memo,
              isPublic,
            })
          }
          className="pressable rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950 disabled:opacity-40"
        >
          기록 완료
        </button>
      </div>
    </div>
  );
}
