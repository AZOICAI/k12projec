# Learning guide — read the codebase in this order

## Glossary

| Term | Meaning |
|------|---------|
| **RLS** | Row Level Security — Postgres rules so users only see their own rows |
| **Server component** | React component that runs on the server (default in App Router) |
| **Client component** | File with `"use client"` — runs in the browser (forms, hooks) |
| **Bearer token** | `Authorization: Bearer …` header the extension sends instead of cookies |
| **Zod schema** | Validates JSON bodies before database writes |

## Start here

1. **Auth redirect** — `apps/web/src/middleware.js` → `lib/supabase/middleware.js`
2. **API auth** — `apps/web/src/lib/supabase/api.js` (`requireUser`)
3. **Shared contracts** — `packages/shared/src/schemas.js`, `api.js`
4. **One full feature** — assignments: page `app/assignments/page.jsx` + `api/v1/assignments/route.js`
5. **Database rules** — `supabase/migrations/20250518000000_init.sql`

## How features are added

1. Add or change SQL in `supabase/migrations/`.
2. Add Zod schema + `apiPaths` entry in `packages/shared`.
3. Add API route under `apps/web/src/app/api/v1/`.
4. Build UI in `apps/web/src/app/app/…` using components from `components/`.

## Extension path

1. `apps/extension/src/lib/api.js` — fetch wrapper
2. `apps/extension/src/popup/PopupApp.jsx` — quick add UI
3. `apps/extension/public/manifest.json` — permissions (patched at build from `.env`)
