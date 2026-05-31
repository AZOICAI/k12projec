-- Assistant features: course grades, assignment starters, study notes

alter table public.courses
  add column if not exists current_grade_percent numeric(5, 2)
    check (current_grade_percent is null or (current_grade_percent >= 0 and current_grade_percent <= 100)),
  add column if not exists target_grade_percent numeric(5, 2)
    check (target_grade_percent is null or (target_grade_percent >= 0 and target_grade_percent <= 100));

alter table public.assignments
  add column if not exists starter_done_at timestamptz;

alter table public.study_blocks
  add column if not exists session_notes text;
