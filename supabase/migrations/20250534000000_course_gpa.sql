-- GPA weighting per class (AP/honors bump on weighted GPA)

alter table public.courses
  add column if not exists credit_hours numeric(4, 1) not null default 1.0
    check (credit_hours > 0 and credit_hours <= 10),
  add column if not exists is_weighted boolean not null default false;
