import type { MetadataRoute } from "next";

/**
 * /c(공유 랜딩)는 차단하지 않는다 — 카카오톡 스크래퍼가 robots.txt를 존중하므로
 * 여길 막으면 링크 미리보기(바이럴 루프의 핵심)가 깨진다.
 * 차단 대상은 개인 화면·admin·개발용 라우트만.
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bean-checker.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/checkin", "/diary", "/dev/", "/login", "/auth/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
