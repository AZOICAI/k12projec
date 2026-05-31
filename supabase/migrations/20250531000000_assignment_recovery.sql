-- Grade recovery flag: extra work to bring class grade up

alter table public.assignments
  add column if not exists is_recovery boolean not null default false;

create index if not exists assignments_user_recovery_idx
  on public.assignments (user_id, is_recovery)
  where is_recovery = true and status <> 'done';
