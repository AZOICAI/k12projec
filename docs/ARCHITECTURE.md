# K12 Planner architecture

## Overview

K12 Planner is a monorepo: a Next.js web app, a Chrome extension, and a shared package. Data lives in **Supabase** (PostgreSQL + Auth). The web app is deployed on **Vercel**.

```
Browser / Extension
        │
        ▼
   Next.js (apps/web)
   ├── Pages (React)
   ├── Middleware (auth redirect)
   └── API routes /api/v1/*
        │
        ▼
   Supabase (Postgres + RLS + Auth)
```

## Request flow (web)

1. User opens a page under `/app/*`.
2. `middleware.js` calls `updateSession` — refreshes Supabase cookies, redirects guests to `/login`.
3. Server components may call `serverApi()` which fetches your own API with cookies.
4. API routes call `requireUser()` — reads session from cookies or `Authorization: Bearer` (extension).
5. Supabase queries run with the user's JWT; **Row Level Security** ensures `user_id = auth.uid()`.

## Extension auth

1. User signs in on the Options page via Supabase `signInWithPassword`.
2. Access + refresh tokens are stored in `chrome.storage.session`.
3. API calls send `Authorization: Bearer <access_token>`.
4. Same API routes as the web app; RLS still applies.

## Key folders

| Path | Role |
|------|------|
| `apps/web/src/app/` | Pages and API routes (App Router) |
| `apps/web/src/components/` | Reusable UI |
| `apps/web/src/lib/supabase/` | Supabase clients for browser, server, middleware, API |
| `packages/shared/` | Zod schemas, API paths, date helpers |
| `apps/extension/` | Chrome MV3 extension (Vite + React) |
| `supabase/migrations/` | SQL schema and RLS policies |

## Deployment

| Piece | Where |
|-------|--------|
| Web | Vercel — root directory `apps/web`, monorepo install from repo root |
| Database | Supabase project |
| Extension | Chrome Web Store (zip from `apps/extension/release/`) |

## Security model

- **Anon key** is public in the browser; safety comes from RLS, not hiding the key.
- Extension **host_permissions** are limited to your app URL and Supabase only.
- Never commit service role keys; use `.env.local` locally and Vercel env vars in production.
