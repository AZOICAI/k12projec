-- Mark assignments the student scored poorly on (separate from redo makeup work).

alter table public.assignments
  add column if not exists is_low_grade boolean not null default false;

create index if not exists assignments_user_low_grade_idx
  on public.assignments (user_id, is_low_grade)
  where is_low_grade = true;
