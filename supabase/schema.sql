-- Chalk Log 데이터베이스 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전해요.

-- 기록 한 건 = 한 줄 (운동한 날 하나, 동작 하나, 설정 하나)
create table if not exists public.entries (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text        not null check (kind in ('workout', 'lift', 'settings')),
  key        text        not null check (char_length(key) between 1 and 100),
  data       jsonb       not null check (octet_length(data::text) < 200000),
  updated_at timestamptz not null default now(),
  primary key (user_id, kind, key)
);

-- 각자 자기 기록만 읽고 쓸 수 있게 막기 (Row Level Security)
alter table public.entries enable row level security;

drop policy if exists "entries: read own"   on public.entries;
drop policy if exists "entries: insert own" on public.entries;
drop policy if exists "entries: update own" on public.entries;
drop policy if exists "entries: delete own" on public.entries;

create policy "entries: read own"   on public.entries for select to authenticated using (auth.uid() = user_id);
create policy "entries: insert own" on public.entries for insert to authenticated with check (auth.uid() = user_id);
create policy "entries: update own" on public.entries for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "entries: delete own" on public.entries for delete to authenticated using (auth.uid() = user_id);

-- 로그인하지 않은 사람(anon)은 아예 접근 못 하게
revoke all on public.entries from anon;
grant select, insert, update, delete on public.entries to authenticated;
