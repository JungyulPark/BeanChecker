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
