-- K12 Planner schema: profiles, terms, courses, meetings, assignments, study_blocks + RLS

create extension if not exists "pgcrypto";

-- Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Terms
create table public.terms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now()
);

create index terms_user_id_idx on public.terms (user_id);

alter table public.terms enable row level security;

create policy "terms_all_own" on public.terms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Courses
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  term_id uuid references public.terms (id) on delete set null,
  name text not null,
  color text not null default '#3B82F6',
  created_at timestamptz not null default now()
);

create index courses_user_id_idx on public.courses (user_id);

alter table public.courses enable row level security;

create policy "courses_all_own" on public.courses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Weekly meeting blocks (optional schedule)
create table public.course_meetings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  weekday smallint not null check (weekday >= 0 and weekday <= 6),
  start_minutes int not null check (start_minutes >= 0 and start_minutes < 1440),
  end_minutes int not null check (end_minutes >= 0 and end_minutes < 1440)
);

create index course_meetings_course_id_idx on public.course_meetings (course_id);

alter table public.course_meetings enable row level security;

create policy "course_meetings_via_course" on public.course_meetings
  for all using (
    exists (
      select 1 from public.courses c
      where c.id = course_meetings.course_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_meetings.course_id and c.user_id = auth.uid()
    )
  );

-- Assignments
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  due_at timestamptz not null,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  notes text,
  estimate_minutes int check (estimate_minutes is null or (estimate_minutes >= 0 and estimate_minutes <= 1440)),
  created_at timestamptz not null default now()
);

create index assignments_user_due_idx on public.assignments (user_id, due_at);
create index assignments_course_id_idx on public.assignments (course_id);

alter table public.assignments enable row level security;

create policy "assignments_all_own" on public.assignments
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.courses c
      where c.id = course_id and c.user_id = auth.uid()
    )
  );

-- Study blocks
create table public.study_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  assignment_id uuid references public.assignments (id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint study_blocks_time_order check (ends_at > starts_at)
);

create index study_blocks_user_start_idx on public.study_blocks (user_id, starts_at);

alter table public.study_blocks enable row level security;

create policy "study_blocks_all_own" on public.study_blocks
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      course_id is null
      or exists (select 1 from public.courses c where c.id = course_id and c.user_id = auth.uid())
    )
    and (
      assignment_id is null
      or exists (select 1 from public.assignments a where a.id = assignment_id and a.user_id = auth.uid())
    )
  );
