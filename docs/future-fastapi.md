# Future: FastAPI backend (learning milestone)

You are **not** required to migrate now. The live app uses **Next.js API routes + Supabase**, which is enough for production.

## When a separate Python API might make sense

- Heavy background jobs (AI scheduling, bulk LMS imports)
- Team prefers Python for data/ML work
- Multiple clients beyond web + Chrome (mobile app)

## A safe migration path (later)

1. Keep Supabase Auth; FastAPI validates JWTs with Supabase's JWKS.
2. Move one resource at a time (e.g. `GET /assignments`) behind FastAPI.
3. Next.js becomes UI + optional BFF, or static export.
4. RLS stays on Postgres; FastAPI uses the user's JWT with the anon key or a restricted service pattern.

## What to avoid early

- Duplicating auth in two systems
- Rewriting everything before product-market fit
- Breaking the extension's stable `/api/v1` contract without versioning

See `docs/ROADMAP.md` for feature timing.
