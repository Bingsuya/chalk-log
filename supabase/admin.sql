-- Chalk Log 관리자 페이지(admin.html) 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전해요.
--
-- 관리자는 다른 사람의 기록을 한 줄씩 읽지 않아요.
-- 아래 함수들이 돌려주는 "숫자로 묶은 통계"와 "받은 의견"만 볼 수 있어요.

-- 1) 관리자 명단: 여기 들어 있는 계정만 관리자 페이지를 볼 수 있어요.
create table if not exists public.admins (
  user_id  uuid        primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- 정책을 하나도 두지 않아서, 앱(anon·authenticated)에서는 이 표를 읽거나 바꿀 수 없어요.
revoke all on public.admins from anon, authenticated;

-- 2) 지금 로그인한 사람이 관리자인지
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- 3) 이용현황 통계 (관리자만)
create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  today  date := (now() at time zone 'Asia/Seoul')::date;
  result jsonb;
begin
  if not public.is_admin() then
    raise exception '관리자만 볼 수 있어요.' using errcode = '42501';
  end if;

  with
  u as (
    select id, created_at, last_sign_in_at,
           (created_at at time zone 'Asia/Seoul')::date      as joined_on,
           (last_sign_in_at at time zone 'Asia/Seoul')::date as seen_on
    from auth.users
  ),
  w as (   -- 운동한 날 기록 (key = 'YYYY-MM-DD')
    select user_id, data,
           case when key ~ '^\d{4}-\d{2}-\d{2}$' then key::date end as d
    from public.entries
    where kind = 'workout'
  ),
  wd as (select * from w where d is not null and d <= today),
  l as (select user_id, data from public.entries where kind = 'lift'),
  s as (select user_id, data from public.entries where kind = 'settings'),
  days as (select generate_series(today - 29, today, interval '1 day')::date as d),
  weeks as (
    select generate_series(date_trunc('week', today - 77)::date, date_trunc('week', today)::date, interval '7 days')::date as wk
  )
  select jsonb_build_object(
    'generatedAt', now(),
    'today', today,
    'totals', jsonb_build_object(
      'users',         (select count(*) from u),
      'new7',          (select count(*) from u where joined_on > today - 7),
      'new30',         (select count(*) from u where joined_on > today - 30),
      'seen7',         (select count(*) from u where seen_on > today - 7),
      'seen30',        (select count(*) from u where seen_on > today - 30),
      'recorders',     (select count(distinct user_id) from wd),
      'active7',       (select count(distinct user_id) from wd where d > today - 7),
      'active30',      (select count(distinct user_id) from wd where d > today - 30),
      'workouts',      (select count(*) from wd),
      'workouts7',     (select count(*) from wd where d > today - 7),
      'runs',          (select count(*) from wd where jsonb_typeof(data->'run') = 'object'),
      'lifters',       (select count(distinct user_id) from l),
      'liftRecords',   (select coalesce(sum(case when jsonb_typeof(data->'history') = 'array'
                                            then jsonb_array_length(data->'history') else 0 end), 0) from l),
      'goalSetters',   (select count(*) from s where jsonb_typeof(data->'goals') = 'array'
                                                and exists (select 1 from jsonb_array_elements(data->'goals') g
                                                            where coalesce((g->>'perWeek')::numeric, 0) > 0)),
      'feedback',      (select count(*) from public.feedback),
      'feedback7',     (select count(*) from public.feedback where (created_at at time zone 'Asia/Seoul')::date > today - 7)
    ),
    -- 최근 30일, 하루씩: 새로 가입 / 운동 기록한 사람 / 운동 기록 수
    'daily', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'd', days.d,
               'joined',  (select count(*) from u where u.joined_on = days.d),
               'active',  (select count(distinct user_id) from wd where wd.d = days.d),
               'workouts',(select count(*) from wd where wd.d = days.d)
             ) order by days.d), '[]'::jsonb)
      from days
    ),
    -- 최근 12주, 한 주씩(월요일 시작): 운동한 사람 / 운동 기록 수 / 새로 가입
    'weekly', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'wk', weeks.wk,
               'active',  (select count(distinct user_id) from wd where wd.d >= weeks.wk and wd.d < weeks.wk + 7),
               'workouts',(select count(*) from wd where wd.d >= weeks.wk and wd.d < weeks.wk + 7),
               'joined',  (select count(*) from u where u.joined_on >= weeks.wk and u.joined_on < weeks.wk + 7)
             ) order by weeks.wk), '[]'::jsonb)
      from weeks
    ),
    -- 종목별 기록 수 (직접 만든 종목은 'custom' 하나로 묶어요)
    'types', (
      select coalesce(jsonb_agg(jsonb_build_object('id', t, 'n', n) order by n desc, t), '[]'::jsonb)
      from (
        select case when x.t in ('crossfit','running','hiking','weight','swim','cycle','yoga','walk')
                    then x.t else 'custom' end as t,
               count(*) as n
        from wd, jsonb_array_elements_text(case when jsonb_typeof(wd.data->'types') = 'array'
                                                then wd.data->'types' else '[]'::jsonb end) as x(t)
        group by 1
      ) tt
    ),
    -- 한 사람이 운동을 며칠 기록했는지 분포
    'depth', (
      select jsonb_build_object(
        'none',  (select count(*) from u where not exists (select 1 from wd where wd.user_id = u.id)),
        'd1',    count(*) filter (where n = 1),
        'd2_4',  count(*) filter (where n between 2 and 4),
        'd5_9',  count(*) filter (where n between 5 and 9),
        'd10',   count(*) filter (where n >= 10)
      )
      from (select user_id, count(*) as n from wd group by user_id) per_user
    )
  ) into result;

  return result;
end;
$$;

-- 4) 받은 의견 (관리자만, 최근 것부터)
create or replace function public.admin_feedback(p_limit integer default 100)
returns table (id uuid, created_at timestamptz, category text, message text, contact text, app_info text, signed_in boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception '관리자만 볼 수 있어요.' using errcode = '42501';
  end if;
  return query
    select f.id, f.created_at, f.category, f.message, f.contact, f.app_info, f.user_id is not null
    from public.feedback f
    order by f.created_at desc
    limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

-- 함수는 로그인한 사람만 부를 수 있고, 안에서 다시 관리자인지 확인해요.
revoke all on function public.is_admin()            from public, anon;
revoke all on function public.admin_stats()         from public, anon;
revoke all on function public.admin_feedback(integer) from public, anon;
grant execute on function public.is_admin()            to authenticated;
grant execute on function public.admin_stats()         to authenticated;
grant execute on function public.admin_feedback(integer) to authenticated;

-- 5) 나를 관리자로 등록하기 (한 번만)
--    아래 줄의 이메일을 앱에 구글로 로그인한 내 이메일로 바꾸고, 맨 앞의 "--" 두 글자를 지운 뒤 Run 하세요.
-- insert into public.admins (user_id) select id from auth.users where email = '내-구글-이메일@gmail.com' on conflict do nothing;
