# 세션 로그 (WORKFLOW.md §6)
<!-- 형식: 날짜 / 한 것 / 막힌 것 / 다음 첫 태스크 / 기각한 디자인 방향과 사유 -->

## 2026-07-08 — 세션 1: 기반 구축
- 한 것: 기획 패키지 루트 커밋 / Next.js 15 스캐폴드(App Router+TS+Tailwind v4, DESIGN_DIRECTION 토큰 반영) / supabase/migrations/0001_init.sql (스키마+RLS+보호 trigger+Storage 정책+pg_cron 집계) / lib/flavorTags.ts 18개 / types/domain.ts zod / 빌드 통과 + 플레이스홀더 렌더 확인
- 막힌 것: 없음. 단 Supabase 프로젝트·Vercel 연결·카카오 콘솔 등록은 사용자 실행 항목(Week 0)으로 미완
- 다음 첫 태스크: 히어로 랜딩 정식 구현 (DESIGN_DIRECTION §3, poster-first, 승인 게이트) — frontend-design 계열 스킬 로드 후
- 디자인 노트: 현 / 페이지는 토큰 검증용 플레이스홀더. 기각 방향 없음

## 2026-07-08 — 세션 2: 코어 플로우 (외부 계정 의존 없는 전부)
- 한 것: **네이밍 보류 결정 반영** — lib/brand.ts 단일 지점, 코드네임 BeanChecker (확정 시 이 파일만 수정) / 히어로 정식 구현 (r3f 프로시저럴 원두 + poster-first + 패럴랙스 + 스크롤 페이드 + reduced-motion/저사양 대응, 포스터·아이콘은 실렌더에서 추출) / 체크인 3스텝 완동 (GPS 근접 정렬·300m 인증·홈브루 제안, 사진 1440px 리사이즈=EXIF 제거, 원두 검색우선+신규등록, IndexedDB 드래프트) / 다이어리 (타임라인+통계+취향 레이더 10건 룰) / 공용 컴포넌트 (RadarChart·StarRating·FlavorSliders·TagPicker) / PWA manifest+아이콘 / E2E 실동작 검증 (체크인→완료→다이어리 반영 확인)
- 막힌 것: 없음. 데이터는 로컬(IndexedDB)+목 시드 — Supabase 프로젝트 생성 시 lib/data/local.ts만 교체
- 다음 첫 태스크: 공유카드 (9:16+1:1 Canvas) + /c/{id} 랜딩 — 전환 엔진. 그 다음 Supabase 연결(사용자 Week 0 완료 후)
- 디자인 노트: 3D 원두는 GLB 소싱 대신 프로시저럴 타원체+센터컷 채택 (외부 에셋 의존 제거, 품질 합격 판단). 스프라이트 대안 경로 불필요

## 2026-07-08 — 세션 3: 디자인 스킬 설치 + /map·발견 페이지 (돌아올 이유 만들기)
- 한 것: **디자인/작업 스킬 3종 설치** — GitHub git clone은 세션 스코프 제한으로 불가했으나 npm(ui-ux-pro-max-cli 정식 설치: ui-ux-pro-max/ui-styling/design-system/brand 채택)과 WebFetch(frontend-design·karpathy 원문 섹션 구조 확인 후 재서술)로 실질적으로 확보. WORKFLOW.md 스킬명 오탈자(ui-ux-max-pro→ui-ux-pro-max) 수정
- **"카피 마실 때마다 열 이유" 감사**: 체크인(마시는 순간 트리거)은 있으나 안 마실 때 돌아올 이유가 약함 — 원인은 이미 승인된 MVP 스코프(TECHNICAL_SPEC §4 라우트)인 `/map`·발견 페이지가 미착수였던 것. 배지/스트릭 없이(CLAUDE.md 금지) 우선순위만 앞당겨 해결
- **구현**: 목데이터 확장(카페/원두 평점·집계·향미태그, 5건 룰 미달 케이스 포함) / BottomNav 공용 컴포넌트(홈/발견/체크인/다이어리, 히어로엔 미적용) / `/map`(최근 내 체크인 + 발견 진입점 + 로스터리 목록) / `/cafe/[district]/[slug]`·`/bean/[origin]/[slug]` 상세(5건 룰 노출, 상호 링크) / `/best/[district]`(랭킹+신규 분리) / `/flavor/[tag]`(태그별 원두) — 전부 generateStaticParams로 SSG, E2E로 체크인→/map 반영·페이지 간 링크 확인
- eslint.config.mjs: .claude/** 제외 (설치된 서드파티 스킬 스크립트가 우리 린트 대상에 안 걸리게)
- 막힌 것: 없음
- 다음 첫 태스크: 공유카드(9:16+1:1) + `/c/{id}` 랜딩. 히어로는 사용자 피드백 대기 중(승인 보류) — 피드백 도착 시 그것부터 반영
- 디자인 노트: 없음 (이번 세션은 Ugly 허용 화면 위주, 토큰만 준수)
