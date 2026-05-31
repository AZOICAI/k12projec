-- Focus timer: log completed study time (not scheduled calendar blocks)

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  duration_minutes int not null check (duration_minutes > 0 and duration_minutes <= 300),
  completed_at timestamptz not null default now()
);

create index if not exists study_sessions_user_completed_idx
  on public.study_sessions (user_id, completed_at desc);

alter table public.study_sessions enable row level security;

create policy "study_sessions_all_own" on public.study_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
