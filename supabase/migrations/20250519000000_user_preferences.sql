-- User preferences for reminders and timezone

create table public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'America/New_York',
  web_notifications_enabled boolean not null default false,
  extension_notifications_enabled boolean not null default false,
  remind_before_hours int[] not null default '{24, 2}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "user_preferences_own" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create preferences row for new users
create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_preferences on auth.users;
create trigger on_auth_user_created_preferences
  after insert on auth.users
  for each row execute function public.handle_new_user_preferences();

-- Backfill existing users
insert into public.user_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Optional: track where an assignment was saved from (extension / LMS)
alter table public.assignments
  add column if not exists source_url text;
