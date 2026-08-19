-- BUNNA 0003_commerce_columns — 수익 동선 링크를 DB 1급 컬럼으로 승격
--
-- 배경: 원두 구매 링크(로스터 공식몰)와 카페 공식 채널은 현재 DB에 없고
-- lib/data/catalog.ts가 시드 매칭으로 덧붙이고 있었다(SEED_PURCHASE/SEED_WEBSITE 맵).
-- 유저 등록 원두·카페에는 링크를 붙일 방법이 아예 없었고, 실데이터가 늘수록 시드 의존은 깨진다.
--
-- ⚠️ 컬럼 권한이 이 마이그레이션의 핵심:
-- 이 두 컬럼은 **수익이 흐르는 경로**다. 보호하지 않으면 아무 로그인 유저나
-- 원두의 purchase_url을 자기 어필리에이트 링크로 바꿔치기할 수 있다(cafes/beans의
-- update 정책은 created_by 본인에게도 열려 있으므로 실제로 가능한 공격이다).
-- 따라서 0002에서 쓰던 reject_protected_columns() 보호 목록에 추가해
-- admin 또는 service role만 변경할 수 있게 한다.

alter table public.beans add column if not exists purchase_url text;
alter table public.cafes add column if not exists website_url text;

comment on column public.beans.purchase_url is
  '로스터 공식몰 구매 링크. 수익 동선 — admin/service role만 변경 가능(0003 보호 트리거).';
comment on column public.cafes.website_url is
  '카페 공식 채널(공식 도메인·인스타). 기사·리뷰 출처는 넣지 않는다 — admin/service role만 변경 가능.';

-- 보호 목록 확장 (0002의 함수를 통째로 재정의 — 기존 보호 항목 전부 유지 + 신규 2건)
create or replace function public.reject_protected_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
begin
  -- JWT가 없는 컨텍스트(pg_cron 배치, 마이그레이션 등 직접 연결)는 API 경유가 아니므로 통과
  if claims is null or claims = ''
     or claims::jsonb->>'role' = 'service_role'
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
       or new.checkin_count is distinct from old.checkin_count
       or new.website_url is distinct from old.website_url then   -- 0003 추가
      raise exception 'protected column';
    end if;
  elsif tg_table_name = 'beans' then
    if new.verified is distinct from old.verified
       or new.hidden is distinct from old.hidden
       or new.merged_into is distinct from old.merged_into
       or new.avg_rating is distinct from old.avg_rating
       or new.avg_profile is distinct from old.avg_profile
       or new.checkin_count is distinct from old.checkin_count
       or new.purchase_url is distinct from old.purchase_url then -- 0003 추가
      raise exception 'protected column';
    end if;
  end if;
  return new;
end;
$$;
