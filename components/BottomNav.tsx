"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 로그인 후 화면들의 공통 하단 네비 — "로그인해도 홈이 없다" 공백 해소용.
 * 히어로(/)에는 넣지 않는다 (DESIGN_DIRECTION §5: 히어로는 단일 캔버스, 볼드함은 한 곳에).
 */
const ITEMS = [
  { href: "/map", label: "홈", icon: HomeIcon },
  { href: "/best/seongsu", label: "발견", icon: CompassIcon },
  { href: "/checkin", label: "체크인", icon: PlusIcon },
  { href: "/diary", label: "다이어리", icon: BookIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // 크림 라이트 전환(2026-08-13): 다크용 반투명 유리는 라이트에서 콘텐츠가 비쳐 읽히지 않는다.
  // 거의 불투명한 크림 + 상단 헤어라인 + 위로 퍼지는 그림자로 "떠 있는 바"를 만든다.
  // blur는 고정 요소에만 허용(supanova §6 성능 가드레일)이라 sticky인 여기는 안전.
  return (
    <nav
      className="sticky bottom-0 z-10 border-t"
      style={{
        borderColor: "var(--surface-ring)",
        background: "rgba(253, 250, 244, 0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow: "0 -8px 24px -12px rgba(70, 45, 20, 0.18)",
      }}
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/map" ? pathname === "/map" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`pressable flex flex-col items-center gap-1 rounded-card px-4 py-1.5 text-caption ${
                  active ? "text-amber-glow" : "text-crema-400"
                }`}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V19a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompassIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11l3.8-1.8Z" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5Z" strokeLinejoin="round" />
      <path d="M4 19V5.5" strokeLinecap="round" />
    </svg>
  );
}
