-- BUNNA 0004 — 스키마를 제품 결정에 맞추고, 스페셜티 전문성 필드를 추가한다.
--
-- (1) checkins.photo_url NOT NULL 해제
--     2026-08-05에 "인증은 보상이지 게이트가 아니다"(CLAUDE.md §1)에 따라 앱에서 사진을
--     선택으로 바꿨는데 스키마는 여전히 필수였다. 이 상태로 서버 쓰기를 붙이면
--     사진 없는 체크인이 전부 insert 실패한다 — 실제로 터질 버그.
--
-- (2) 스페셜티 전문성 필드
--     로스팅 날짜: 스페셜티에서 신선도는 핵심 변수(로스팅 후 7~21일이 피크).
--       원두가 아니라 **체크인**에 붙는다 — 같은 원두라도 잔마다 다르기 때문.
--     품종(variety): 게이샤·SL28·티피카 등. 스페셜티인에겐 원산지만큼 중요한 1급 속성.
--       원두 고유 속성이므로 beans에 붙고, 수익 링크와 달리 정보성이라 보호 목록에는 넣지 않는다
--       (유저 정정이 오히려 데이터 품질을 올리는 필드 — reports로 오류를 잡는 쪽이 맞다).

alter table public.checkins alter column photo_url drop not null;

alter table public.beans add column if not exists variety text;
alter table public.checkins add column if not exists roast_date date;

comment on column public.checkins.photo_url is
  '사진은 선택 — 없으면 null. 인증 배지는 gps_verified가 담당한다.';
comment on column public.beans.variety is
  '품종(게이샤·SL28·티피카 등). 유저 편집 허용 — 정정이 품질을 올리는 정보성 필드.';
comment on column public.checkins.roast_date is
  '로스팅 일자. 원두가 아니라 체크인에 붙는다 — 같은 원두도 잔마다 신선도가 다르다.';

-- 미래 값 방지: 로스팅 날짜가 오늘보다 미래일 수 없다
alter table public.checkins
  add constraint checkins_roast_date_not_future
  check (roast_date is null or roast_date <= current_date);
