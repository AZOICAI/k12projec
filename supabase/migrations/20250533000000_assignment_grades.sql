-- Per-assignment grades (Canvas sync) and redo linkage

alter table public.assignments
  add column if not exists score numeric(10, 2),
  add column if not exists points_possible numeric(10, 2),
  add column if not exists grade_percent numeric(5, 2)
    check (grade_percent is null or (grade_percent >= 0 and grade_percent <= 100)),
  add column if not exists redo_of_assignment_id uuid references public.assignments (id) on delete set null,
  add column if not exists redo_dismissed boolean not null default false;

create index if not exists assignments_redo_of_idx
  on public.assignments (redo_of_assignment_id)
  where redo_of_assignment_id is not null;
