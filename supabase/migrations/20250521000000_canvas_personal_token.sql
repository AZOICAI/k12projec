-- Personal (user-generated) Canvas tokens for testing before school OAuth key

alter table public.canvas_connections
  add column if not exists auth_type text not null default 'oauth'
    check (auth_type in ('oauth', 'personal'));
