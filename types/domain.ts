import { z } from "zod";
import { FLAVOR_TAG_IDS, MAX_FLAVOR_TAGS_PER_CHECKIN } from "@/lib/flavorTags";

/**
 * 앱 도메인 타입 — DB 타입은 `supabase gen types typescript` 산출물(types/database.ts)을 쓴다.
 * 여기는 DB 스키마로 표현되지 않는 검증 규칙(0.5 스텝, 태그 사전 멤버십)만 담는다.
 */

/** 향미 5축 프로필 (0–10) — checkins.profile / beans.avg_profile */
export const flavorProfileSchema = z.object({
  acidity: z.number().min(0).max(10),
  sweetness: z.number().min(0).max(10),
  body: z.number().min(0).max(10),
  bitterness: z.number().min(0).max(10),
  aftertaste: z.number().min(0).max(10),
});
export type FlavorProfile = z.infer<typeof flavorProfileSchema>;

/** 별점 0.5–5.0, 0.5 단위 (스텝 검증은 앱단 책임 — DB는 범위만 본다) */
export const ratingSchema = z
  .number()
  .min(0.5)
  .max(5)
  .refine((v) => Number.isInteger(v * 2), "별점은 0.5 단위");

export const checkinInputSchema = z
  .object({
    context: z.enum(["cafe", "home"]),
    cafeId: z.string().uuid().nullable(),
    beanId: z.string().uuid(),
    brewMethod: z.enum(["espresso", "filter", "other"]),
    rating: ratingSchema,
    profile: flavorProfileSchema,
    flavorTags: z
      .array(z.enum(FLAVOR_TAG_IDS as [string, ...string[]]))
      .min(1)
      .max(MAX_FLAVOR_TAGS_PER_CHECKIN),
    photoUrl: z.string().url(),
    gpsVerified: z.boolean(),
    memo: z.string().max(140).optional(),
    isPublic: z.boolean().default(true),
  })
  .refine((c) => c.context === "home" || c.cafeId !== null, {
    message: "카페 체크인에는 cafeId가 필요합니다",
    path: ["cafeId"],
  });
export type CheckinInput = z.infer<typeof checkinInputSchema>;
