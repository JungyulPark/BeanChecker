"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StepCafe } from "./StepCafe";
import { StepPhoto } from "./StepPhoto";
import { StepRate, type RateResult } from "./StepRate";
import { RadarChart } from "@/components/RadarChart";
import { ShareSheet } from "@/components/ShareSheet";
import { clearDraft, loadDraft, saveDraft } from "@/lib/data/local";
import { saveCheckin } from "@/lib/data/checkins";
import { useSession } from "@/lib/auth/session";
import type { LocalCheckin } from "@/lib/data/local";
import type { MockCafe } from "@/lib/mock/seed";
import { shareCardDataFromCheckin } from "@/lib/shareCard";

type Step = 1 | 2 | 3;
const STEP_TITLES: Record<Step, string> = {
  1: "어디서 마셨나요?",
  2: "한 장 남겨요",
  3: "어떤 잔이었나요?",
};

/**
 * 체크인 3스텝 (카페선택→사진→평가). 3탭 초과 금지 원칙.
 * 드래프트는 IndexedDB에 저장 — 유일한 로컬 저장 예외 (TECHNICAL_SPEC §3).
 */
export default function CheckinPage() {
  const { user } = useSession();
  const [step, setStep] = useState<Step>(1);
  const [context, setContext] = useState<"cafe" | "home">("cafe");
  const [cafe, setCafe] = useState<{
    id: string;
    name: string;
    district: string;
    slug: string | null; // null = 유저가 즉석 등록한 카페 (카탈로그에 없음)
  } | null>(null);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [done, setDone] = useState<LocalCheckin | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [restored, setRestored] = useState(false);

  // 드래프트 복원
  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft?.step && draft.step >= 2) {
        setStep(draft.step as Step);
        setContext(draft.context ?? "cafe");
        setCafe(
          draft.cafeId && draft.cafeName
            ? {
                id: draft.cafeId,
                name: draft.cafeName,
                district: draft.cafeDistrict ?? "",
                slug: draft.cafeSlug ?? null,
              }
            : null,
        );
        setGpsVerified(draft.gpsVerified ?? false);
        setPhotoDataUrl(draft.photoDataUrl ?? null);
      }
      setRestored(true);
    });
  }, []);

  // 드래프트 저장
  useEffect(() => {
    if (!restored || done) return;
    saveDraft({
      step,
      context,
      cafeId: cafe?.id ?? null,
      cafeName: cafe?.name ?? null,
      cafeDistrict: cafe?.district ?? null,
      cafeSlug: cafe?.slug ?? null,
      gpsVerified,
      photoDataUrl: photoDataUrl ?? undefined,
    });
  }, [restored, done, step, context, cafe, gpsVerified, photoDataUrl]);

  const handleSelectCafe = (selected: MockCafe, verified: boolean) => {
    setContext("cafe");
    setCafe({
      id: selected.id,
      name: selected.name,
      district: selected.district,
      // localCafeToMock은 slug 자리에 로컬 id를 넣는다 — 카탈로그 slug가 아니므로 이관 키가 못 된다
      slug: selected.id.startsWith("local-cafe-") ? null : selected.slug,
    });
    setGpsVerified(verified);
    setStep(2);
  };

  const handleSelectHome = () => {
    setContext("home");
    setCafe(null);
    setGpsVerified(false);
    setStep(2);
  };

  const handleSubmit = async (r: RateResult) => {
    const record = await saveCheckin({
      context,
      cafeId: cafe?.id ?? null,
      cafeName: cafe?.name ?? null,
      cafeDistrict: cafe?.district ?? null,
      cafeSlug: cafe?.slug ?? null,
      beanId: r.bean.id,
      beanName: r.bean.name,
      roasterName: r.bean.roasterName,
      beanOrigin: r.bean.origin,
      beanSlug: r.bean.slug,
      brewMethod: r.brewMethod,
      rating: r.rating,
      profile: r.profile,
      flavorTags: r.flavorTags,
      roastDate: r.roastDate,
      photoDataUrl,
      gpsVerified,
      memo: r.memo || undefined,
      isPublic: r.isPublic,
    }, user?.id ?? null);
    await clearDraft();
    setDone(record);
  };

  if (done) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-6 py-14 text-center">
        <div className="bg-aura absolute inset-x-0 top-0 h-[50dvh] opacity-50" aria-hidden />
        <p className="relative text-caption tracking-[0.08em] text-crema-400">
          {done.gpsVerified ? "카페 인증 체크인" : done.context === "home" ? "홈브루" : "체크인"}
          {done.gpsVerified && <span className="ml-1 text-amber-glow">●</span>}
        </p>
        <h1 className="font-display relative mt-3 text-h2 text-crema-100">
          {done.beanName}
        </h1>
        {done.cafeName && (
          <p className="relative mt-1 text-body text-crema-400">{done.cafeName}</p>
        )}
        <div className="relative my-4">
          <RadarChart profile={done.profile} size={230} />
        </div>
        <p className="font-mono relative text-h2 text-amber-glow">
          ★ {done.rating.toFixed(1)}
        </p>

        {showShare ? (
          <div className="relative mt-8 w-full">
            <ShareSheet data={shareCardDataFromCheckin(done)} />
          </div>
        ) : (
          <div className="relative mt-10 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowShare(true)}
              className="pressable rounded-full bg-amber-glow px-8 py-3.5 text-body font-semibold text-roast-950"
            >
              공유카드 만들기
            </button>
            <Link
              href="/diary"
              className="rounded-full border border-roast-700 px-8 py-3 text-body text-crema-100"
            >
              다이어리에서 보기
            </Link>
            <button
              type="button"
              onClick={() => {
                setDone(null);
                setShowShare(false);
                setStep(1);
                setCafe(null);
                setPhotoDataUrl(null);
                setGpsVerified(false);
                setContext("cafe");
              }}
              className="py-2 text-body text-crema-400"
            >
              한 잔 더 기록하기
            </button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <Link href="/map" className="text-caption text-crema-400">
            ← 홈
          </Link>
          <div className="flex gap-1.5" aria-label={`3단계 중 ${step}단계`}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`h-1.5 w-6 rounded-full ${
                  s <= step ? "bg-amber-glow" : "bg-roast-700"
                }`}
              />
            ))}
          </div>
        </div>
        <h1 className="font-display mt-5 text-h2 text-crema-100">
          {STEP_TITLES[step]}
        </h1>
        {step === 2 && context === "home" && (
          <p className="mt-1 text-caption text-crema-400">홈브루로 기록 중</p>
        )}
        {step === 2 && cafe && (
          <p className="mt-1 text-caption text-crema-400">
            {cafe.name}
            {gpsVerified && <span className="ml-1 text-amber-glow">● 인증</span>}
          </p>
        )}
      </header>

      {step === 1 && (
        <StepCafe onSelectCafe={handleSelectCafe} onSelectHome={handleSelectHome} />
      )}
      {step === 2 && (
        <StepPhoto
          context={context}
          photoDataUrl={photoDataUrl}
          onPhoto={setPhotoDataUrl}
          onNext={() => setStep(3)}
        />
      )}
      {step === 3 && (
        <StepRate
          cafeId={cafe?.id ?? null}
          cafeName={cafe?.name ?? null}
          onSubmit={handleSubmit}
        />
      )}

      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep((s) => (s - 1) as Step)}
          className="mt-6 text-caption text-crema-400 underline underline-offset-4"
        >
          이전 단계로
        </button>
      )}
    </main>
  );
}
