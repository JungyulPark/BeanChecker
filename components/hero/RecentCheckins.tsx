import { RadarChart } from "@/components/RadarChart";
import type { FlavorProfile } from "@/types/domain";

/**
 * 히어로 하단 "살아있는 서비스 증거" — 최근 공개 체크인 3장 가로 스크롤.
 * DB 연결 전까지는 예시 카드 (연결 시 최근 공개 체크인 쿼리로 교체).
 */
const SAMPLES: {
  bean: string;
  cafe: string;
  rating: number;
  tags: string[];
  profile: FlavorProfile;
}[] = [
  {
    bean: "에티오피아 워르카 첼베사",
    cafe: "커피리브레 연남",
    rating: 4.5,
    tags: ["베리", "꽃향"],
    profile: { acidity: 8, sweetness: 7, body: 4, bitterness: 2, aftertaste: 7 },
  },
  {
    bean: "케냐 니에리 AA",
    cafe: "앤트러사이트 한남",
    rating: 4.0,
    tags: ["시트러스", "와이니"],
    profile: { acidity: 9, sweetness: 5, body: 5, bitterness: 3, aftertaste: 6 },
  },
  {
    bean: "콜롬비아 우일라 수프리모",
    cafe: "메쉬커피",
    rating: 4.0,
    tags: ["초콜릿", "견과"],
    profile: { acidity: 4, sweetness: 7, body: 8, bitterness: 5, aftertaste: 6 },
  },
];

export function RecentCheckins() {
  return (
    <section className="px-6 pb-20">
      <h2 className="mb-4 text-caption tracking-[0.08em] text-crema-400">
        방금 기록된 잔들
      </h2>
      <div className="-mx-6 flex snap-x gap-3 overflow-x-auto px-6 pb-2">
        {SAMPLES.map((s) => (
          <article
            key={s.bean}
            className="w-64 shrink-0 snap-start rounded-card border border-roast-700 bg-roast-900 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-body text-amber-glow">
                ★ {s.rating.toFixed(1)}
              </span>
              <div className="flex gap-1">
                {s.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-roast-700 px-2 py-0.5 text-caption text-crema-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="my-2 flex justify-center">
              <RadarChart profile={s.profile} size={140} showLabels={false} />
            </div>
            <p className="truncate text-body font-semibold text-crema-100">{s.bean}</p>
            <p className="mt-0.5 truncate text-caption text-crema-400">{s.cafe}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
