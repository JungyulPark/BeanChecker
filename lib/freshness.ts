/**
 * 로스팅 신선도 — 스페셜티와 일반 커피를 가르는 가장 실용적인 변수.
 *
 * 왜 원두가 아니라 체크인에 붙는가:
 *   같은 원두라도 "로스팅 3일차"와 "로스팅 40일차"는 다른 음료다.
 *   원두 테이블에 날짜를 두면 마지막에 입력한 사람의 값이 모두를 덮어쓴다.
 *   잔 단위 속성이므로 checkins.roast_date가 맞다 (0004 마이그레이션).
 *
 * 왜 달력이 아니라 칩인가:
 *   "자유 텍스트 입력을 1차 UX로 두지 않는다"(CLAUDE.md §6) + 3탭 원칙.
 *   봉투에 적힌 날짜를 달력에서 찾아 누르는 건 모바일에서 3~4탭이다.
 *   실제로 사람이 아는 건 "며칠 지났나"이고, 그건 한 탭이다.
 *   정밀한 날짜가 필요하면 칩으로 고른 뒤 값이 date로 저장되므로 손실이 없다.
 */

/** 로컬 타임존 기준 자정 — UTC 변환에서 하루 밀리는 것을 막는다 */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM-DD" (Postgres date 컬럼과 동일 표기). toISOString은 UTC로 밀리므로 쓰지 않는다 */
export function toDateString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** n일 전 날짜 문자열 */
export function daysAgoDate(days: number, now: Date = new Date()): string {
  const d = startOfDay(now);
  d.setDate(d.getDate() - days);
  return toDateString(d);
}

/** 로스팅 후 경과일. 미래 날짜면 null (0004의 CHECK 제약과 동일 규칙) */
export function daysOffRoast(
  roastDate: string | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!roastDate) return null;
  const [y, m, d] = roastDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const roast = new Date(y, m - 1, d);
  const diff = Math.round(
    (startOfDay(now).getTime() - roast.getTime()) / 86_400_000,
  );
  return diff < 0 ? null : diff;
}

export type FreshnessStage = "resting" | "peak" | "fading" | "past";

/**
 * 구간 기준: 로스터리 권장 음용구간의 통설(디개싱 3~5일, 피크 1~3주)을 따른다.
 * 추출 방식·로스팅 강도에 따라 실제 구간은 달라지므로 단정하지 않는 문구를 쓴다.
 */
export function freshnessStage(days: number): FreshnessStage {
  if (days <= 3) return "resting";
  if (days <= 21) return "peak";
  if (days <= 45) return "fading";
  return "past";
}

export const FRESHNESS_COPY: Record<FreshnessStage, { label: string; note: string }> = {
  resting: { label: "디개싱 중", note: "가스가 아직 빠지는 중 — 며칠 뒤가 더 열려요" },
  peak: { label: "음용 적기", note: "향이 가장 잘 올라오는 구간" },
  fading: { label: "지나는 중", note: "단맛은 남지만 향이 눕기 시작하는 시기" },
  past: { label: "한참 지남", note: "본래 맛과는 다를 수 있어요" },
};

/** "로스팅 12일차" — 표시용 한 줄 */
export function roastAgeLabel(days: number): string {
  return days === 0 ? "로스팅 당일" : `로스팅 ${days}일차`;
}

/**
 * 체크인 스텝에서 노출하는 선택지. 값은 "며칠 전"이고 저장은 date로 변환된다.
 * 3주 이상은 하루 단위 정밀도가 의미 없어 대표값(28일)으로 뭉갠다 —
 * 없는 정밀도를 있는 척하지 않는다.
 */
export const ROAST_AGE_CHOICES = [
  { days: 0, label: "오늘" },
  { days: 3, label: "3일 전" },
  { days: 7, label: "1주 전" },
  { days: 14, label: "2주 전" },
  { days: 28, label: "3주+" },
] as const;
