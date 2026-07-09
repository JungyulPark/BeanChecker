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

## 2026-07-09 — 세션 4: 공유카드 + /c 랜딩 (전환 엔진)
- 한 것: **공유 데이터 스톱갭 결정** — Supabase 없이도 `/c/{id}`가 어느 기기에서든 동작하도록 체크인 핵심 필드를 URL-safe base64로 인코딩(lib/shareCard.ts). id는 지금은 데이터 블롭이지만 URL 형태(`/c/[id]`)는 그대로 유지한 채 Supabase 연결 시 실제 uuid+DB조회로 교체 예정 — 이미 공유된 링크가 안 깨짐
- 클라이언트 Canvas 공유카드(9:16+1:1, lib/shareCard/render.ts): 다크 아우라+원두명+별점+레이더+태그칩+로고/URL. 폰트 프리로드(document.fonts.ready) 필수 확인. 사진은 카드에 넣지 않음(스펙에 없는 요소)
- ShareSheet 컴포넌트: Web Share API Level 2(files) → 미지원 시 이미지 저장+카톡 텍스트 복사, 인스타 2탭 가이드 — 체크인 완료 화면에 "공유카드 만들기"로 연동
- `/c/[id]` SSR 랜딩(RadarChart 재사용) + `/c/[id]/opengraph-image`(@vercel/og Satori, 1:1)
- **버그 2건 발견·수정**: ①Satori 기본 폰트에 ★(U+2605) 글리프가 없어 OG 이미지에서 깨짐 → SVG 벡터 아이콘으로 교체 ②1:1 카드가 9:16과 같은 폰트 크기를 써서 원두명·태그·URL이 겹침 → 정사각형 전용 레이아웃(작은 폰트+콘텐츠 흐름 기준 하단 배치)으로 재설계. 카드에 찍히는 URL도 표시용으로 축약(실제 공유 링크는 항상 전체 URL)
- 실제 서버(next start) 기반 E2E로 체크인→카드 생성→클립보드 캡션→/c 랜딩→OG 이미지 바이트까지 전부 실렌더 확인
- 막힌 것: 없음. 배포 후 NEXT_PUBLIC_SITE_URL env 설정 필요(현재 localhost 폴백)
- 다음 첫 태스크: Supabase 연결(사용자 Week 0 완료 후) — lib/data/local.ts 교체 + `/c/[id]`를 실제 checkins.id 조회로 전환. 그 전까지는 admin 페이지나 시딩 스크립트 등 스코프 남은 항목 진행 가능

## 2026-07-09 — 세션 5: 네이밍 확정 — BEAN.
- 한 것: @orchestrator가 이름을 **BEAN.**(국문: 빈.)으로 확정. lib/brand.ts 단일 지점 수정 한 곳으로 히어로/`/map`/페이지 타이틀/PWA manifest/공유카드/OG 이미지까지 전부 자동 반영됨을 실렌더로 확인 — 브랜드 추상화가 의도대로 작동. 전 문서(CLAUDE.md/WORKFLOW.md/TECHNICAL_SPEC.md/DESIGN_DIRECTION.md/launch/*.md/skills/*.md) 마스트헤드 VEANN→BEAN. 일괄 치환, supabase 마이그레이션의 cron job 이름도 변경(미배포 상태라 안전)
- NAMING.md: BEAN. 확정 기록 + **미검증 경고** — 기존 §확정 절차는 VEANN 등 이전 후보군 대상이라 BEAN.에 대해 도메인/상표/SNS 핸들 재검증 필요(특히 "bean"은 일반명사라 L.L.Bean 등과의 상표 충돌 확인 필수, 마침표 포함 워드마크는 SNS 핸들 표기 별도 고민 필요)
- 막힌 것: 없음
- 다음 첫 태스크: 세션4와 동일(Supabase 연결 대기) — 그 사이 NAMING.md §확정 절차(도메인/상표/SNS) 실행은 사용자 몫

## 2026-07-09 — 세션 6: FAMIMA 레퍼런스 반영 + 실데이터 시딩 리서치
- 한 것: 사용자 제공 FAMIMA(패밀리마트 리브랜딩) 레퍼런스에서 워드마크 로고타입 기법(볼드 지오메트릭 서체+투톤 스플릿+언더라인 바)을 채택해 우리 팔레트(BEAN=crema-100, .=amber-glow)로 번역 — Space Grotesk 폰트 추가, `components/Wordmark.tsx`/`lib/shareCard/render.ts`/`opengraph-image.tsx` 3곳에 동일 규칙 이식, DESIGN_DIRECTION.md에 정식 문서화(레퍼런스 표 최초로 채움)
- **실제 시딩 데이터 리서치**: 5개 지역(성수·한남/연남·합정/을지로·익선동·서촌/압구정·신사·양재/망원·해방촌 등) 병렬 웹 리서치 에이전트로 실존 스페셜티 로스터리 조사 — 네이버맵/카카오맵 크롤링 없이 공식 홈페이지·인스타그램·커피 전문 매체만 출처로 사용, 자체 로스팅 미확인/확신도 낮은 곳은 제외(추측 금지 원칙). `launch/seed-cafes.csv`(49곳) + `launch/seed-beans.csv`(28종, 공식 컵노트 원문 확인된 것만) + `launch/SEED_NOTES.md`(방법론·한계 문서화) 신규 작성. LAUNCH_CHECKLIST.md 시딩 항목 갱신
- 막힌 것: 없음. 단 정직하게 밝힌 한계 — ①영업 여부는 전부 "미확인"(웹 검색만으론 실시간 폐업 여부 보증 불가, 사람이 확인해야 함) ②원두는 100~150종 목표 대비 28종(다수 공식 사이트가 자동 접근 차단되어 공식 컵노트 원문 확보 실패, padding 안 함)
- 다음 첫 태스크: 세션4와 동일(Supabase 연결 대기). 그 사이 진행 가능: admin 페이지, PWA 마감, 법무 문서 실작성, 또는 시딩 갭(원두 100~150종) 보강 재시도
- 디자인 노트: FAMIMA는 그린+시안 투톤에 밝은 배경 — 색·배경 톤은 채택 안 함(다크 프리미엄 포지셔닝과 충돌). 장치(투톤+언더라인)만 분리 채택한 것이 핵심 판단

## 2026-07-09 — 세션 7: admin + 신고(제보) 파이프라인
- 한 것: 라우트 기준 스펙 재대조 — `/admin`만 유일하게 미착수였음을 확인(그 외 SEO 메타/sitemap/PWA SW/법무 문서 실작성도 공백이나 사용자가 admin 먼저로 결정). 사용자 아이디어(가게 직접 클레임)로 이어지는 "다리" 전략을 실제로 구현: `lib/data/local.ts`에 LocalReport 스토어(addReport/listReports/updateReportStatus) + checkins.hidden 필드 추가, `components/ReportButton.tsx`(사유 선택+메모, cafe/bean 상세페이지·다이어리 체크인에 배치), `/admin` 페이지(상태별 필터, 처리완료/기각, 체크인 신고는 숨기기까지 실제 동작)
- verified·병합은 admin/service role 전용 RLS로 보호되는 실 DB 작업이라 로컬 mock 배열에 가짜 토글을 만들지 않고 "Supabase 연결 후 구현" 안내로 남김 — 병합 배치 로직 자체는 이미 0001_init.sql의 recompute_aggregates()에 구현되어 있음
- 실서버 E2E로 카페/원두/체크인 3종 신고 접수 → admin 필터·처리완료(체크인은 숨김 반영까지) → 다이어리에 "숨김 처리됨" 배지 노출 확인
- 막힌 것: 없음. `/admin`은 실 Auth 게이트가 없어 지금은 아무나 열 수 있음 — 코드 주석·화면 배지로 명시, Supabase 연결 시 반드시 미들웨어 추가 필요
- **추가 작업(같은 세션)**: 위 게이트 공백을 즉시 해결 — `middleware.ts`로 `/admin` HTTP Basic Auth 보호 추가(`ADMIN_BASIC_AUTH_USER`/`PASSWORD` env, **fail-closed**: 미설정 시 전부 401). 비밀번호는 서버(엣지 미들웨어)에서만 비교되고 클라이언트 번들에 노출 안 됨. `.env.example` 신규 작성, TECHNICAL_SPEC §3 Auth에 임시 상태 문서화. curl로 4가지 케이스(env없음/인증없음/틀린비번/올바른인증) 전부 실동작 확인 — env없음·인증없음·틀린비번 401, 올바른 인증만 200, 하위경로까지 보호됨
- 다음 첫 태스크: SEO 메타데이터+sitemap, PWA Service Worker, 법무 문서 실작성 중 사용자 선택. Supabase 연결은 여전히 사용자 Week 0 대기 (연결 시 이 Basic Auth 미들웨어는 profiles.is_admin 세션 체크로 교체)
- 디자인 노트: 없음 (Ugly 허용 화면, 토큰만 준수)
- 디자인 노트: 없음
- 디자인 노트: 공유카드 톤은 히어로와 동일 토큰(아우라+앰버) 재사용 — 브랜드 시각 자산 일관성 유지, 별도 방향 탐색 불필요
