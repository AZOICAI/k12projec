-- Canvas LMS connection (tokens: server-only via service role, no RLS policies)

create table public.canvas_connections (
  user_id uuid primary key references auth.users (id) on delete cascade,
  canvas_domain text not null,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.canvas_connections enable row level security;

-- No policies: clients cannot read tokens; API routes use service role.

alter table public.courses
  add column if not exists canvas_course_id text;

create unique index if not exists courses_user_canvas_course_idx
  on public.courses (user_id, canvas_course_id)
  where canvas_course_id is not null;

alter table public.assignments
  add column if not exists canvas_assignment_id text,
  add column if not exists canvas_course_id text;

create unique index if not exists assignments_user_canvas_assignment_idx
  on public.assignments (user_id, canvas_assignment_id)
  where canvas_assignment_id is not null;

alter table public.user_preferences
  add column if not exists email_reminders_enabled boolean not null default false;
