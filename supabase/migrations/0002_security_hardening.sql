-- BEAN. 0002_security_hardening — 2026-07-12 실프로젝트(bean-checker, ap-northeast-2) 적용 완료
-- Supabase 보안 어드바이저 지적 + 0001의 배치 차단 버그 수정.
-- (1) postgis를 extensions 스키마로 이전 (public API 노출 제거, spatial_ref_sys RLS 린트 해소)
-- (2) 내부 전용 함수의 anon/authenticated EXECUTE 회수
-- (3) photos 버킷의 전체 목록(listing) 정책 제거 — 공개 URL 접근은 정책 불필요
-- (4) reject_protected_columns: 직접 DB 연결(pg_cron 등, JWT 없음) 통과 — 0001에서는
--     cron 배치가 집계 컬럼을 갱신할 때 보호 트리거에 걸려 실패했다 (실버그).

-- (1) postgis 이전 — cafes.location이 의존하므로 컬럼 재생성 (적용 시점에 테이블 비어 있음)
drop extension postgis cascade;
create extension postgis with schema extensions;
alter table public.cafes add column location extensions.geography(point) not null;

-- (4) 보호 트리거 수정: request.jwt.claims가 아예 없는 컨텍스트(pg_cron, 마이그레이션 등
-- 직접 연결)는 API 경유가 아니므로 통과시킨다. API 요청은 anon이라도 claims가 항상 존재.
create or replace function public.reject_protected_columns()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  claims text := current_setting('request.jwt.claims', true);
begin
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

-- (2) 내부 전용 함수 EXECUTE 회수.
-- is_admin()은 RLS 정책이 호출자 권한으로 실행하므로 EXECUTE를 유지해야 한다 — 회수 금지.
-- (어드바이저 WARN 1건은 이 의도된 예외로, boolean 반환 외 정보 노출이 없다.)
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.reject_protected_columns() from anon, authenticated, public;
revoke execute on function public.recompute_aggregates() from anon, authenticated, public;

-- (3) photos 버킷 listing 차단 — 공개 버킷의 객체 URL 접근은 SELECT 정책 없이 동작
drop policy photos_read on storage.objects;
