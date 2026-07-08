/**
 * SCA Flavor Wheel 기반 향미 태그 사전 — 18개 고정.
 * 단일 출처: TECHNICAL_SPEC.md §1. 변경은 @coffee_expert 승인 후 스펙 문서 먼저 수정.
 * DB에는 id(slug)로 저장한다.
 */
export const FLAVOR_TAG_GROUPS = [
  {
    group: "fruit",
    label: "과일",
    tags: [
      { id: "berry", label: "베리" },
      { id: "citrus", label: "시트러스" },
      { id: "tropical", label: "열대과일" },
      { id: "stone-fruit", label: "핵과(복숭아류)" },
      { id: "apple-pear", label: "사과/배" },
    ],
  },
  {
    group: "sweet",
    label: "단맛",
    tags: [
      { id: "chocolate", label: "초콜릿" },
      { id: "caramel", label: "캐러멜" },
      { id: "brown-sugar", label: "흑설탕" },
      { id: "honey", label: "꿀" },
      { id: "vanilla", label: "바닐라" },
    ],
  },
  {
    group: "floral-herb",
    label: "플로럴/허브",
    tags: [
      { id: "floral", label: "꽃향" },
      { id: "black-tea", label: "홍차" },
      { id: "herbal", label: "허브" },
    ],
  },
  {
    group: "nutty-grain",
    label: "너티/곡물",
    tags: [
      { id: "nutty", label: "견과" },
      { id: "roasted-grain", label: "구운곡물" },
    ],
  },
  {
    group: "other",
    label: "기타",
    tags: [
      { id: "winey", label: "와이니" },
      { id: "spicy", label: "스파이시" },
      { id: "smoky", label: "스모키" },
    ],
  },
] as const;

export type FlavorTag = (typeof FLAVOR_TAG_GROUPS)[number]["tags"][number];
export type FlavorTagId = FlavorTag["id"];

export const FLAVOR_TAGS: readonly FlavorTag[] = FLAVOR_TAG_GROUPS.flatMap(
  (g): readonly FlavorTag[] => g.tags,
);

export const FLAVOR_TAG_IDS = FLAVOR_TAGS.map((t) => t.id) as FlavorTagId[];

export const MAX_FLAVOR_TAGS_PER_CHECKIN = 3;
