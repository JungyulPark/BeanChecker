-- BEAN. 0001_init — TECHNICAL_SPEC.md §1–3 구현
-- 스키마 변경은 이 디렉토리의 마이그레이션 파일로만 (대시보드 수기 변경 금지)

create extension if not exists postgis;
create extension if not exists pg_cron;

-- ============================================================
-- §1 테이블
-- ============================================================

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
  cafe_id uuid references cafes(id),              -- context='cafe'일 때 필수
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

-- ============================================================
-- 헬퍼: admin 판정 (RLS 정책에서 재사용)
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select is_admin from profiles where id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- 가입 시 프로필 자동 생성 (auth.users → profiles)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, display_name, photo_url, provider)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '커피러버'),
    new.raw_user_meta_data->>'avatar_url',
    case when new.raw_app_meta_data->>'provider' in ('google','kakao')
         then new.raw_app_meta_data->>'provider' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- §2 admin 전용 컬럼 보호 trigger
-- (verified, hidden, merged_into, avg_*, checkin_count, is_admin은
--  service role 또는 admin만 변경 가능)
-- ============================================================

create or replace function public.reject_protected_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- service role은 RLS/trigger 우회 대상이 아니므로 명시적으로 통과
  if current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role'
     or public.is_admin() then
    return new;
  end if;

  if tg_table_name = 'profiles' then
    if new.is_admin is distinct from old.is_admin
       or new.checkin_count is distinct from old.checkin_count then
      raise exception 'protected column';
    end if;
  elsif tg_table_name = 'cafes' then
    if new.verified is distinct from old.verified
       or new.hidden is distinct from old.hidden
       or new.avg_rating is distinct from old.avg_rating
       or new.checkin_count is distinct from old.checkin_count then
      raise exception 'protected column';
    end if;
  elsif tg_table_name = 'beans' then
    if new.verified is distinct from old.verified
       or new.hidden is distinct from old.hidden
       or new.merged_into is distinct from old.merged_into
       or new.avg_rating is distinct from old.avg_rating
       or new.avg_profile is distinct from old.avg_profile
       or new.checkin_count is distinct from old.checkin_count then
      raise exception 'protected column';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on profiles
  for each row execute function public.reject_protected_columns();
create trigger cafes_protect before update on cafes
  for each row execute function public.reject_protected_columns();
create trigger beans_protect before update on beans
  for each row execute function public.reject_protected_columns();

-- ============================================================
-- §2 RLS — 전 테이블 enable
-- ============================================================

alter table profiles enable row level security;
alter table cafes enable row level security;
alter table beans enable row level security;
alter table checkins enable row level security;
alter table user_stats enable row level security;
alter table reports enable row level security;

-- profiles: 본인 row만 select/update (admin은 운영상 전체 select)
create policy profiles_select on profiles for select
  using (id = auth.uid() or public.is_admin());
create policy profiles_update on profiles for update
  using (id = auth.uid() or public.is_admin());

-- checkins: insert는 본인. select는 본인 전체 + 타인은 is_public and not hidden
create policy checkins_insert on checkins for insert
  with check (auth.uid() = user_id);
create policy checkins_select on checkins for select
  using (user_id = auth.uid() or (is_public and not hidden) or public.is_admin());
create policy checkins_update on checkins for update
  using (user_id = auth.uid() or public.is_admin());
create policy checkins_delete on checkins for delete
  using (user_id = auth.uid() or public.is_admin());

-- cafes/beans: 공개 read(hidden 제외), 로그인 유저 insert, update는 created_by/admin
create policy cafes_select on cafes for select
  using (not hidden or public.is_admin());
create policy cafes_insert on cafes for insert
  with check (auth.uid() is not null and created_by = auth.uid());
create policy cafes_update on cafes for update
  using (created_by = auth.uid() or public.is_admin());

create policy beans_select on beans for select
  using (not hidden or public.is_admin());
create policy beans_insert on beans for insert
  with check (auth.uid() is not null and created_by = auth.uid());
create policy beans_update on beans for update
  using (created_by = auth.uid() or public.is_admin());

-- user_stats: 본인만 read (쓰기는 배치=service role)
create policy user_stats_select on user_stats for select
  using (user_id = auth.uid() or public.is_admin());

-- reports: insert 로그인 유저, select/update admin만
create policy reports_insert on reports for insert
  with check (auth.uid() is not null and reporter_id = auth.uid());
create policy reports_select on reports for select
  using (public.is_admin());
create policy reports_update on reports for update
  using (public.is_admin());

-- ============================================================
-- Storage: photos 버킷 (5MB, image/*, 경로 {uid}/... 본인만 write, read public)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg','image/png','image/webp']);

create policy photos_read on storage.objects for select
  using (bucket_id = 'photos');
create policy photos_write on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy photos_delete on storage.objects for delete
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- §3 집계 배치 — pg_cron 일배치 (03:00 KST = 18:00 UTC), 전체 재계산
-- 수정/삭제 정합성을 증분 없이 흡수. 증분 카운터 금지.
-- ============================================================

create or replace function public.recompute_aggregates()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  -- 0) 병합 배치: merged_into가 세팅된 원두의 체크인을 대상 원두로 이관
  update checkins c set bean_id = b.merged_into
  from beans b
  where c.bean_id = b.id and b.merged_into is not null;

  -- 1) beans: 카운트 / 5건 룰 평점 / 평균 프로필
  update beans b set
    checkin_count = coalesce(s.cnt, 0),
    avg_rating = case when coalesce(s.cnt, 0) >= 5 then s.avg_r else null end,
    avg_profile = s.avg_p
  from (
    select bean_id,
           count(*) cnt,
           round(avg(rating), 1) avg_r,
           jsonb_build_object(
             'acidity',    round(avg((profile->>'acidity')::numeric), 1),
             'sweetness',  round(avg((profile->>'sweetness')::numeric), 1),
             'body',       round(avg((profile->>'body')::numeric), 1),
             'bitterness', round(avg((profile->>'bitterness')::numeric), 1),
             'aftertaste', round(avg((profile->>'aftertaste')::numeric), 1)
           ) avg_p
    from checkins where not hidden
    group by bean_id
  ) s
  where b.id = s.bean_id;

  -- 집계 대상에서 빠진 원두(체크인 전부 삭제/이관)는 0으로 리셋
  update beans set checkin_count = 0, avg_rating = null, avg_profile = null
  where id not in (select distinct bean_id from checkins where not hidden)
    and (checkin_count <> 0 or avg_rating is not null or avg_profile is not null);

  -- 2) cafes: 동일 패턴
  update cafes c set
    checkin_count = coalesce(s.cnt, 0),
    avg_rating = case when coalesce(s.cnt, 0) >= 5 then s.avg_r else null end
  from (
    select cafe_id, count(*) cnt, round(avg(rating), 1) avg_r
    from checkins where not hidden and cafe_id is not null
    group by cafe_id
  ) s
  where c.id = s.cafe_id;

  update cafes set checkin_count = 0, avg_rating = null
  where id not in (select distinct cafe_id from checkins where not hidden and cafe_id is not null)
    and (checkin_count <> 0 or avg_rating is not null);

  -- 3) profiles.checkin_count
  update profiles p set checkin_count = coalesce(s.cnt, 0)
  from (select user_id, count(*) cnt from checkins where not hidden group by user_id) s
  where p.id = s.user_id;

  -- 4) user_stats: 'all' + 당월. avg_profile은 10건 이상부터
  insert into user_stats (user_id, period, checkin_count, avg_profile, top_roaster_id, top_flavor_tags, updated_at)
  select
    s.user_id, s.period, s.cnt,
    case when s.cnt >= 10 then s.avg_p else null end,
    s.top_roaster, s.top_tags, now()
  from (
    select
      c.user_id,
      periods.period,
      count(*) cnt,
      jsonb_build_object(
        'acidity',    round(avg((c.profile->>'acidity')::numeric), 1),
        'sweetness',  round(avg((c.profile->>'sweetness')::numeric), 1),
        'body',       round(avg((c.profile->>'body')::numeric), 1),
        'bitterness', round(avg((c.profile->>'bitterness')::numeric), 1),
        'aftertaste', round(avg((c.profile->>'aftertaste')::numeric), 1)
      ) avg_p,
      (select b.roaster_id from checkins c2 join beans b on b.id = c2.bean_id
        where c2.user_id = c.user_id and not c2.hidden and b.roaster_id is not null
          and (periods.period = 'all' or to_char(c2.created_at at time zone 'Asia/Seoul', 'YYYY-MM') = periods.period)
        group by b.roaster_id order by count(*) desc limit 1) top_roaster,
      (select array_agg(tag order by tag_cnt desc) from (
        select tag, count(*) tag_cnt from checkins c3, unnest(c3.flavor_tags) tag
        where c3.user_id = c.user_id and not c3.hidden
          and (periods.period = 'all' or to_char(c3.created_at at time zone 'Asia/Seoul', 'YYYY-MM') = periods.period)
        group by tag order by count(*) desc limit 3
      ) t) top_tags
    from checkins c
    cross join lateral (
      values ('all'), (to_char(now() at time zone 'Asia/Seoul', 'YYYY-MM'))
    ) periods(period)
    where not c.hidden
      and (periods.period = 'all'
           or to_char(c.created_at at time zone 'Asia/Seoul', 'YYYY-MM') = periods.period)
    group by c.user_id, periods.period
  ) s
  on conflict (user_id, period) do update set
    checkin_count = excluded.checkin_count,
    avg_profile = excluded.avg_profile,
    top_roaster_id = excluded.top_roaster_id,
    top_flavor_tags = excluded.top_flavor_tags,
    updated_at = excluded.updated_at;
end;
$$;

select cron.schedule(
  'bean-daily-aggregates',
  '0 18 * * *',  -- 18:00 UTC = 03:00 KST
  $$select public.recompute_aggregates()$$
);
