# K12 Planner

A coursework planner for online high school students: web app with cloud sync (Supabase) and a Chrome extension for quick assignment capture.

Built with **JavaScript** (Next.js, React, Vite) — no TypeScript compile step.

## Monorepo layout

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 15 app (dashboard, courses, assignments, calendar, study blocks) |
| `apps/extension` | Manifest V3 Chrome extension (popup quick-add, options sign-in) |
| `packages/shared` | Zod schemas, API paths, shared types |
| `supabase/migrations` | Postgres schema + Row Level Security |

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (free tier works)

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com/).
2. In the SQL editor, run the migration in [`supabase/migrations/20250518000000_init.sql`](supabase/migrations/20250518000000_init.sql).
3. Under **Authentication → Providers**, enable Email and optionally Google.
4. Under **Authentication → URL configuration**, add:
   - Site URL: `https://k12projec.vercel.app` (add `http://localhost:3000` only if you still develop locally)
   - Redirect URLs: `https://k12projec.vercel.app/auth/callback`
5. Copy **Project URL** and **anon public** key from **Settings → API**.

## 2. Web app

```bash
cd k12projec
npm install
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local with your Supabase values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and add courses and assignments.

## 3. Browser extension

```bash
cp apps/extension/.env.example apps/extension/.env
# Optional: prefill VITE_* values (same as web Supabase + localhost app URL)
npm run build -w extension
```

Load unpacked extension in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `apps/extension/dist`
4. Set `VITE_APP_URL` in `apps/extension/.env` to your **live** site URL, run `npm run build -w extension`, reload the extension in Chrome, then sign in under **Options**.

### Production extension

1. Set `VITE_APP_URL` and Supabase values in [`apps/extension/.env`](apps/extension/.env) (see [`.env.example`](apps/extension/.env.example)).
2. Run `npm run build -w extension` — `patch-manifest` adds your live URL to Chrome permissions (no localhost).
3. Reload the extension at `chrome://extensions`.
4. **Chrome Web Store:** run `npm run package:extension:store`, upload `apps/extension/release/k12-planner-v0.1.0.zip` at [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole/). Copy listing text from `apps/extension/store/LISTING.txt`. Privacy policy: `https://k12projec.vercel.app/privacy`. Review usually takes 1–3 days.

## Deploy web (Vercel) — live URL (not localhost)

1. Push this repo to **GitHub**.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo.
3. Set **Root Directory** to `apps/web`.
4. Under **Environment Variables** (Production), add:
   - `NEXT_PUBLIC_SUPABASE_URL` — same as local
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — same as local
   - `NEXT_PUBLIC_APP_URL` — `https://YOUR-PROJECT.vercel.app` (your Vercel URL, no trailing slash)
5. Deploy. Copy your production URL (e.g. `https://k12-planner-xyz.vercel.app`).

### Supabase (required after deploy)

In Supabase → **Authentication** → **URL configuration**:

- **Site URL:** `https://YOUR-PROJECT.vercel.app`
- **Redirect URLs:** `https://YOUR-PROJECT.vercel.app/auth/callback`

Remove or keep localhost URLs only if you still develop locally.

### Extension + env after deploy

1. Edit `apps/extension/.env`: set `VITE_APP_URL=https://YOUR-PROJECT.vercel.app`
2. `npm run build -w extension`
3. Reload extension in Chrome; open **Options** → Save settings → Sign in

## API (v1)

All routes require a session cookie (web) or `Authorization: Bearer <access_token>` (extension).

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/v1/terms` | List / create terms |
| GET/POST | `/api/v1/courses` | List / create courses |
| GET/POST | `/api/v1/assignments` | List / create (`?from=&to=` optional) |
| GET/POST | `/api/v1/study-blocks` | List / create study blocks |
| GET | `/api/v1/extension-session` | Verify bearer token |

Schemas and path constants live in `@k12/shared`.

## Scripts

```bash
npm run dev          # web dev server
npm run dev:extension # extension watch build
npm run build        # web + extension
npm run lint         # web ESLint
```

## License

Private / educational use — add a license if you open-source this project.
