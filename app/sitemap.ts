import type { MetadataRoute } from "next";
import { MOCK_BEANS, MOCK_CAFES, DISTRICTS } from "@/lib/mock/seed";
import { FLAVOR_TAGS } from "@/lib/flavorTags";

/**
 * 프로그래매틱 SEO의 관문 (TECHNICAL_SPEC §4, CLAUDE.md 개발순서 6).
 * 엔트리는 시드 데이터 기준 — Supabase에만 있는 신규 항목은 ISR로 렌더는 되지만
 * 사이트맵에는 다음 빌드에 반영된다 (시드가 곧 시딩 DB와 동일하므로 현재는 완전 일치).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bean-checker.vercel.app";
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily" as const, priority: 1 },
    ...MOCK_CAFES.map((c) => ({
      url: `${base}/cafe/${c.district}/${c.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...MOCK_BEANS.map((b) => ({
      url: `${base}/bean/${b.origin}/${b.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...DISTRICTS.map((d) => ({
      url: `${base}/best/${d.id}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
    ...FLAVOR_TAGS.map((t) => ({
      url: `${base}/flavor/${t.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
