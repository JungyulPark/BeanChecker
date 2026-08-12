import { GEAR_ITEMS, GEAR_DISCLOSURE } from "@/lib/gear";

/**
 * 홈브루 장비 추천 — 쿠팡 파트너스 링크가 있는 항목만 렌더.
 * 전부 미설정이면 null(섹션 통째로 숨김) — 파트너스 승인 전 법적 리스크 0.
 * 어필리에이트 링크는 rel="sponsored" (구글 가이드라인) + 대가성 고지 상시 표시(공정위).
 */
export function GearSection() {
  const items = GEAR_ITEMS.filter((g) => g.url !== null);
  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-1 text-body font-semibold text-crema-100">홈브루 장비</h2>
      <p className="mb-3 text-caption text-crema-400">
        기록이 늘수록 궁금해지는 것들 — 입문 표준 구성
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((g) => (
          <li key={g.id}>
            <a
              href={g.url!}
              target="_blank"
              rel="noopener sponsored"
              className="flex items-center justify-between glass-card pressable px-4 py-3"
            >
              <span className="min-w-0 flex-1 pr-3">
                <span className="block truncate text-body font-semibold text-crema-100">
                  {g.name}
                </span>
                <span className="block truncate text-caption text-crema-400">{g.note}</span>
              </span>
              <span className="shrink-0 text-caption text-amber-glow">{g.category} ↗</span>
            </a>
          </li>
        ))}
      </ul>
      {/* 대가성 고지 — 공정위 표시광고법. 링크가 노출되는 한 항상 함께 표시 */}
      <p className="mt-2 text-caption leading-relaxed text-crema-400">{GEAR_DISCLOSURE}</p>
    </section>
  );
}
