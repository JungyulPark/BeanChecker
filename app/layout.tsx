import type { Metadata } from "next";
import { Nanum_Myeongjo, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { BRAND } from "@/lib/brand";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { SessionProvider } from "@/lib/auth/session";
import { CheckinSync } from "@/components/CheckinSync";
import "./globals.css";

const display = Nanum_Myeongjo({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-nanum-myeongjo",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

/** 워드마크 전용 (라틴 로고타입에만 사용, 국문 본문은 계속 Pretendard) — FAMIMA 레퍼런스 캘리브레이션 */
const wordmarkFont = Space_Grotesk({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  // 도메인 미확정(NAMING.md) — Vercel 배포 시 NEXT_PUBLIC_SITE_URL env로 실 도메인 주입
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`, // SEO 페이지들의 generateMetadata title에 브랜드 접미 자동 부착
  },
  description: BRAND.description,
  openGraph: {
    siteName: BRAND.name,
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${display.variable} ${mono.variable} ${wordmarkFont.variable}`}>
      <head>
        <link
          rel="stylesheet"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          {children}
          <CheckinSync />
        </SessionProvider>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
