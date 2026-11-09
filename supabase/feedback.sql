-- Chalk Log 고객센터(의견 보내기) 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 을 누르세요.
-- 여러 번 실행해도 안전해요.

create table if not exists public.feedback (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id    uuid        default auth.uid() references auth.users (id) on delete set null,
  category   text        not null check (category in ('idea', 'bug', 'etc')),
  message    text        not null check (char_length(message) between 1 and 2000),
  contact    text        check (contact is null or char_length(contact) <= 200),
  app_info   text        check (app_info is null or char_length(app_info) <= 300)
);

-- 누구나(로그인 안 한 사람 포함) 보내기만 할 수 있고, 읽기·수정·삭제는 못 해요.
-- 보낸 의견은 관리자만 대시보드(Table Editor → feedback)에서 볼 수 있어요.
alter table public.feedback enable row level security;

drop policy if exists "feedback: anyone can send" on public.feedback;
create policy "feedback: anyone can send" on public.feedback
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

revoke all on public.feedback from anon, authenticated;
grant insert on public.feedback to anon, authenticated;
