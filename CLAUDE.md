# VEANN — CLAUDE.md (마스터 v3)

> 작업명: VEANN (비앤/빈 — 네이밍 근거는 NAMING.md, 도메인 확정 전까지 코드네임 겸 유력 확정안)
> 한 줄 정의: 스페셜티 커피 전용 체크인·향미 평가·발견 플랫폼. "Vivino for Specialty Coffee"
> 원칙: 추측 금지. 설명 금지. 직설적으로 실행 가능하게. Ship Fast / Ugly but Functional — 단, 히어로와 공유카드 두 곳만은 예외적으로 아름다워야 한다.
> **개발 환경: Claude Code (web) + GitHub + Vercel. 이 문서가 Claude Code의 최상위 컨텍스트다. 세션 운영 규칙은 WORKFLOW.md를 먼저 읽는다.**

---

## 0. v3 스택 (v2에서 전면 교체 — Firebase 제거)

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind | Vercel 네이티브, SSR/ISR로 SEO 요구 그대로 충족 |
| 배포 | Vercel (GitHub 연동, PR 프리뷰) | main 머지 = 배포. 프리뷰 URL이 @orchestrator 리뷰 단위 |
| DB/Auth/Storage | **Supabase** (Postgres + RLS, Auth, Storage) | **카카오 OAuth 네이티브 지원** — v2의 OIDC 커스텀 작업 소멸. PostGIS로 근접 쿼리 |
| 집계 배치 | Supabase pg_cron (SQL 일배치) | 평균/카운트 집계는 SQL 한 방. 서버리스 함수 불필요 |
| OG 이미지 | @vercel/og (Satori) | /c, /cafe, /bean 동적 OG |
| 지도 | Kakao Maps JS SDK | 국내 전용 MVP |
| 앱 형태 | **PWA** (manifest + Service Worker) | iOS 유저 다수 → iOS 사파리 제약은 웹 플로우로 우회, 네이티브 앱은 PMF 후 재론 |
| 공유카드 | 클라이언트 Canvas (유지) | 기존 검증된 접근 |

원칙: 위 표에 없는 인프라 도입은 @orchestrator(=사용자) 승인 필요. 그 외 세부 구현 선택은 Claude Code가 상황에 맞춰 결정하되 커밋 메시지에 근거 1줄.

## 1. 제품 정체성

### 문제
- 스페셜티 커피 소비자는 카페 투어 + 인증샷 문화가 이미 있지만, 이를 구조화해 기록·공유·발견하는 전용 플랫폼이 없다.
- 일반 맛집앱(카카오맵, 네이버플레이스)은 "커피 맛" 데이터 구조가 없다. 별점 하나로 끝.
- Untappd(맥주), Vivino(와인)의 커피 자리가 글로벌·국내 모두 공백. 국내 CUPNOTE는 개인 기록에 머물러 소셜/바이럴 루프 부재.

### 해법 (차별화 3축)
1. **원두 1차 개체 데이터 모델**: 카페가 아니라 원두(bean)가 기본 단위.
2. **SCA Flavor Wheel 기반 향미 태그**: 고정 태그 18개. 마찰 감소 + 구조화 데이터 축적.
3. **체크인 인증**: GPS + 사진. 인증은 보상(배지)이지 게이트가 아니다.

### Moat: 향미 태그 구조화 DB / 한국 스페셜티 로스터리·원두 DB 선점 / Q그레이더 감수 E-E-A-T

> **제품 목적·페인포인트·공유 설계·최종 목표의 정본은 PRODUCT.md** — 기능 논쟁이 생기면 그 문서로 돌아온다.

## 2. MVP 스코프 (1차 릴리즈 — 이것만)

| # | 기능 |
|---|------|
| 0 | **히어로 랜딩** — 360° 회전 원두 (DESIGN_DIRECTION.md §히어로). 비로그인 첫 화면이자 브랜드 선언 |
| 1 | 체크인 (3스텝: 카페선택→사진→평가, 홈브루 자동 전환 포함) |
| 2 | 향미 평가 (5축 슬라이더 + 태그 3개 + 별점 0.5 단위) |
| 3 | 커피 다이어리 (타임라인 + 통계 + 취향 레이더) |
| 4 | 공유 카드 (9:16 + 1:1) + **/c/{id} 딥링크 랜딩** (바이럴 루프 완결) |
| 5 | admin 최소 페이지 (verified/병합/신고 처리 — Ugly 허용) |

2차로 미룰 것 (절대 1차 금지): 팔로우/피드, 추천 알고리즘, 로스터리 대시보드, 배지/게이미피케이션, 광고, 결제, **네이티브 앱(iOS) — PWA 지표로 수요 검증 후**.

## 3. 수익 모델 / KPI (변경 없음)
- Phase 1 무료. Go/No-Go(4주차): **DAU 30 + 주간 체크인 100** + 중간지표 **공유율 30%** / **카드 경유 유입→가입 전환** 측정
- Phase 2 프리미엄 리포트·리캡, Phase 3 로스터리 파트너십·어필리에이트. AdSense 금지(프리미엄 포지셔닝 전).

## 4. 개발 순서 (Ship 시퀀스)
1. **WORKFLOW.md 프로토콜로 세션 시작** (plan 모드 → 승인 → 구현)
2. Supabase 스키마 + RLS (TECHNICAL_SPEC §1–2) — types는 supabase gen types로 생성, 수기 타입 금지
3. 히어로 랜딩 (디자인 검증을 가장 먼저 — 이 프로젝트의 품질 기준점)
4. 체크인 플로우 → 다이어리 → 공유카드 + /c 랜딩 → admin
5. 시딩 (서울 로스터리 50곳 + 원두 100~150) — 영업 여부 전수 확인 후
6. SEO 프로그래매틱 페이지 + 인덱싱 (런칭 전)
7. PWA 마감 (manifest, SW, iOS 홈화면 추가 안내)

## 5. Subagent 팀 (역할 유지 — skills/ 참조)
@orchestrator(최종 승인) / @designer / @frontend / @backend / @coffee_expert / @seo / @copywriter / @marketer
크로스 체크 쌍: coffee_expert↔copywriter, designer↔frontend, seo↔backend. 상세는 각 skills 파일.

## 6. 금지사항 (전 subagent 공통)
- 자유 텍스트 입력을 1차 UX로 두지 않는다 / 체크인 3탭 초과 금지
- "AI가 분석했습니다" 류 AI-speak 카피 금지 / 동물 이모지 공유카드 금지
- **GPS 좌표 원본을 DB에 저장하지 않는다** (gps_verified 불리언만 — 위치정보법 리스크 최소화)
- 평점 집계는 5건 룰 미만 비노출 (개별 체크인은 노출) — 확정 정책
- 네이버/카카오 지도 데이터 크롤링 금지 (시딩은 공식 채널 기반)
- Supabase service role 키를 클라이언트 번들에 노출 금지 (server-only)
- 파스텔 톤 금지, 템플릿 디폴트 디자인 금지 (DESIGN_DIRECTION.md 강제)
