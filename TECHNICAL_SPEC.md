# VEANN — TECHNICAL_SPEC.md (v3)

> 추측 금지. 이 문서의 스키마/로직을 그대로 구현한다. 변경 필요 시 @orchestrator 승인 후 문서 먼저 수정.
> v3: Firebase → Supabase(Postgres+RLS) 전환. v2에서 확정한 로직(홈브루 context, 5건 룰, 중복 병합, 드래프트 예외, 좌표 미저장, 딥링크 랜딩)은 전부 승계.

---

## 1. 데이터 모델 (Postgres — supabase/migrations/0001_init.sql)

```sql
create extension if not exists postgis;
create extension if not exists pg_cron;

-- auth.users 연동 프로필
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  photo_url text,
  provider text check (provider in ('google','kakao')),
  is_admin boolean not null default false,
  checkin_count int not null default 0,          -- 배치 집계
  created_at timestamptz not null default now(),
  deleted_at timestamptz                          -- 소프트 삭제 → 배치가 개인정보 파기
);

create table cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_roastery boolean not null default false,
  location geography(point) not null,             -- 근접 쿼리: ST_DWithin
  address text not null,
  district text not null,                         -- "seongsu" — SEO 키 (slug형)
  slug text not null,
  checkin_count int not null default 0,           -- 배치 집계
  avg_rating numeric(2,1),                        -- 5건 룰 미달 시 null = 비노출
  verified boolean not null default false,
  hidden boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (district, slug)
);

create table beans (
  id uuid primary key default gen_random_uuid(),
  name text not null,                             -- "에티오피아 워르카 첼베사"
  normalized_name text not null,                  -- 소문자·공백·특수문자 제거 (중복 방지)
  roaster_id uuid references cafes(id),           -- 로스터리 = cafes(is_roastery)
  origin text not null,                           -- 국가 (slug형: "ethiopia")
  region text,
  process text check (process in ('washed','natural','honey','anaerobic','other')),
  roast_level int check (roast_level between 1 and 5),
  roast_year int,
  official_notes text[],                          -- 로스터 공식 컵노트, 출처 그대로
  avg_profile jsonb,                              -- {acidity,sweetness,body,bitterness,aftertaste} 0-10
  avg_rating numeric(2,1),                        -- 5건 룰
  checkin_count int not null default 0,
  slug text not null,
  verified boolean not null default false,
  hidden boolean not null default false,
  merged_into uuid references beans(id),          -- 중복 병합: 존재하면 read redirect
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (origin, slug)
);
create index beans_normalized_idx on beans (normalized_name text_pattern_ops);

create table checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  context text not null check (context in ('cafe','home')),
  cafe_id uuid references cafes(id),              -- context='cafe'일 때 필수 (constraint 아래)
  bean_id uuid not null references beans(id),
  brew_method text not null check (brew_method in ('espresso','filter','other')),
  rating numeric(2,1) not null check (rating between 0.5 and 5.0),  -- step 0.5는 앱단 검증
  profile jsonb not null,                         -- FlavorProfile 5축
  flavor_tags text[] not null check (array_length(flavor_tags,1) <= 3),
  photo_url text not null,
  gps_verified boolean not null default false,    -- 좌표 원본은 저장하지 않는다
  memo text check (char_length(memo) <= 140),
  is_public boolean not null default true,
  hidden boolean not null default false,          -- 신고 임시조치
  created_at timestamptz not null default now(),
  check (context = 'home' or cafe_id is not null)
);
create index checkins_user_idx on checkins (user_id, created_at desc);
create index checkins_cafe_idx on checkins (cafe_id, created_at desc);
create index checkins_bean_idx on checkins (bean_id, created_at desc);

create table user_stats (
  user_id uuid references profiles(id) on delete cascade,
  period text not null,                           -- '2026-07' | 'all'
  checkin_count int not null default 0,
  avg_profile jsonb,                              -- 10건 이상부터 산출
  top_roaster_id uuid,
  top_flavor_tags text[],
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('checkin','bean','cafe')),
  target_id uuid not null,
  reporter_id uuid not null references profiles(id),
  reason text not null check (reason in ('spam','inappropriate_photo','defamation','wrong_info','other')),
  memo text,
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at timestamptz not null default now()
);
```

TypeScript 타입은 `supabase gen types typescript`로 생성해 `types/database.ts`로 커밋. 수기 인터페이스 작성 금지 (드리프트 방지). 앱 도메인 타입(FlavorProfile 등)은 `types/domain.ts`에 zod 스키마와 함께.

### 향미 태그 사전 (18개 고정 — @coffee_expert 관할, `lib/flavorTags.ts` 하드코딩)
- 과일: 베리, 시트러스, 열대과일, 핵과(복숭아류), 사과/배
- 단맛: 초콜릿, 캐러멜, 흑설탕, 꿀, 바닐라
- 플로럴/허브: 꽃향, 홍차, 허브
- 너티/곡물: 견과, 구운곡물
- 기타: 와이니, 스파이시, 스모키

## 2. RLS (Row Level Security — 전 테이블 enable)
- profiles: 본인 row만 select/update. is_admin 컬럼은 클라이언트 update 불가 (컬럼 권한 분리 또는 trigger 거부)
- checkins: insert는 auth.uid()=user_id. select는 본인 전체 + 타인은 `is_public and not hidden`. update/delete 본인만
- beans/cafes: 로그인 유저 insert 허용. update는 created_by 또는 admin. **verified, hidden, merged_into, avg_*, checkin_count는 admin/service role만** (trigger로 일반 update에서 해당 컬럼 변경 거부)
- reports: insert 로그인 유저, select/update admin만
- Storage(photos 버킷): 5MB 제한, image/* MIME만, 경로 `{uid}/...` 본인만 write, read는 public

## 3. 핵심 로직

### Auth
- Supabase Auth: Google + **Kakao 프로바이더 (네이티브 지원 — 카카오 개발자 콘솔 앱 등록 + redirect URL만 설정)**. Week 1 선행 태스크.
- 미들웨어: 로그인 필수 라우트 = /checkin, /diary, /admin. 그 외 전부 비로그인 열람 가능.

### GPS 체크인 인증 (v2 확정 로직 유지)
```
1. 체크인 스텝1 진입 시 위치권한 요청 (앱 진입 시 아님 — 거부율 최소화)
2. 좌표는 클라이언트에서만 사용: 후보 카페 근접 정렬 + haversine 거리 계산
3. ≤300m → gps_verified: true (배지) / >300m 또는 거부 → 체크인 허용,
   "홈브루로 기록할까요?" 1탭 제안 → 수락 시 context='home', 사진 가이드 전환
4. 좌표 원본은 어디에도 저장·전송하지 않는다 (불리언만 서버로)
```
서버 검증: 근접 카페 목록 자체는 서버 라우트(PostGIS ST_DWithin, 반경 2km)에서 내려주되 클라이언트 좌표는 쿼리 파라미터로만 쓰고 로깅 제외.

### 원두 선택/등록 (중복 방지 — v2 유지)
검색 우선(normalized_name prefix + 해당 카페 최근 체크인 원두 상단 고정) → 결과 없을 때만 신규 등록(2필드) → normalized_name 동일 존재 시 선택 유도. admin 병합: merged_into 세팅 + 배치가 checkins.bean_id 이관.

### 집계 (pg_cron 일배치 — 03:00 KST, 전체 재계산)
```sql
-- 개념: 수정/삭제 정합성을 증분 없이 흡수
update beans b set
  checkin_count = s.cnt,
  avg_rating = case when s.cnt >= 5 then s.avg_r else null end,
  avg_profile = s.avg_p
from ( ... group by bean_id ... ) s where b.id = s.bean_id;
-- cafes, profiles.checkin_count, user_stats 동일 패턴. 10건 미만 유저는 avg_profile null.
```

### 평점 노출 정책 (확정)
- 집계 5건 미만: avg_rating null → UI "평가 수집 중". 개별 체크인은 노출.
- /best 랭킹: 5건 미달 카페는 "신규 카페" 섹션 분리, 랭킹 미포함.
- hidden=true는 모든 공개 쿼리 제외.

### 체크인 드래프트 (유일한 로컬 저장 예외)
3스텝 입력값+사진을 IndexedDB에 드래프트 저장 → 전송 성공 시 삭제. 오프라인 실패 시 토스트 + 자동 재시도. DB가 유일한 영구 저장소 원칙 유지.

### 사진 처리
클라이언트 리사이즈 긴 변 1440px / JPEG 0.8 (캔버스 재인코딩 → EXIF 자연 제거, 테스트로 확인). Storage 상한 5MB 유지.

### 공유 카드 (전환 엔진 — 최우선 품질)
- Canvas 렌더 9:16 + 1:1. 다크 아우라 그라데이션 / 카페·원두명 / 별점 / 레이더 차트(5축) / 태그 칩 / 로고 + `/c/{id}` URL
- 한글 폰트 서브셋 프리로드 (미로딩 렌더 = 카드 깨짐, QA 필수)
- 공유 우선순위: ①Web Share API Level 2(files) ②미지원 시 이미지 저장 안내 + 카톡용 텍스트 복사 ③인스타 스토리는 "저장 후 업로드" 2탭 가이드가 공식 플로우 (iOS 사파리 실기기 QA)
- **/c/{checkinId} 랜딩**: 비로그인 열람, @vercel/og로 OG 이미지 = 공유카드 1:1 버전, 상단 CTA "내 커피 취향도 차트로". 카드가 유입, 랜딩이 전환.

## 4. 라우트/SEO
```
/                            히어로 랜딩 (DESIGN_DIRECTION §히어로)
/map                         홈/지도 (로그인 후 기본 진입점)
/checkin                     3스텝 플로우
/diary                       다이어리
/cafe/[district]/[slug]     ISR
/bean/[origin]/[slug]       ISR
/best/[district]            ISR — 지역 랭킹
/flavor/[tag]               ISR — 태그별 원두
/c/[checkinId]              공유 딥링크 랜딩 (SSR)
/admin                      isAdmin만
```
- Next.js ISR(revalidate 1h)로 SSR/사전렌더 요구 충족. sitemap.ts 자동 생성.
- Schema.org: CafeOrCoffeeShop, Product. **AggregateRating은 체크인 5건 이상 페이지에만 출력.**
- 네이버 서치어드바이저 + Google Search Console 둘 다 등록. SSR이라 네이버 수집 문제 없음.

## 5. PWA (iOS 우선 고려)
- manifest(name, icons 512/192, display: standalone, theme_color 다크) + Service Worker(Serwist): 셸 프리캐시 + 배포 시 캐시 무효화 (기존 SW 버그 재발 방지 항목 승계)
- iOS 사파리: 설치 유도 배너("공유 → 홈 화면에 추가") — 방문 2회차부터 노출, 닫으면 재노출 금지
- 웹푸시는 2차 (iOS 16.4+ 홈화면 설치 시 가능 — PMF 후)
- 안 되는 것은 웹 플로우로 우회한다: 인스타 직접 공유 불가 → 저장 후 업로드 / 카메라는 input capture로 충분

## 6. 성능/비용 예산
- LCP < 2.5s — **히어로 3D는 poster 이미지 선출력 후 lazy 마운트** (DESIGN_DIRECTION §히어로 성능 규칙)
- 체크인 완료 인터랙션 15초 이내 / 공유카드 생성 < 1s
- 지도 근접 쿼리: 서버 라우트 결과 60s 캐시(Vercel) — Supabase 무료 티어 보호
- 비용: Vercel Hobby + Supabase Free로 MVP 전 구간 $0 목표. 초과 알림 세팅
