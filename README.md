# K12 Planner

A coursework planner for online high school students: web app with cloud sync (Supabase) and a Chrome extension for quick assignment capture.

**Live app:** [https://k12projec.vercel.app](https://k12projec.vercel.app)

Built with **JavaScript** (Next.js, React, Vite).

## Monorepo layout

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 15 app (dashboard, courses, assignments, calendar, study blocks) |
| `apps/extension` | Manifest V3 Chrome extension (popup quick-add, options sign-in) |
| `packages/shared` | Zod schemas, API paths, shared types |
| `supabase/migrations` | Postgres schema + Row Level Security |
| `docs/` | Architecture, [`BETA_SETUP.md`](docs/BETA_SETUP.md), [`CANVAS_SETUP.md`](docs/CANVAS_SETUP.md), roadmap |

## Use the app (students & teachers)

1. Open **[https://k12projec.vercel.app](https://k12projec.vercel.app)** in Chrome or any browser.
2. **Sign up** or **Sign in** (email or Google, if enabled in Supabase).
3. Add **courses**, then **assignments** (or use **Quick Add** with `/` on the dashboard).
4. Optional: install the **Chrome extension** (see below) to save work from Google Classroom.

No install on your computer is required for the website — only the browser.

## Chrome extension

1. Set `VITE_APP_URL=https://k12projec.vercel.app` in `apps/extension/.env` (see [`.env.example`](apps/extension/.env.example)).
2. From the repo root: `npm install` then `npm run build -w extension`.
3. In Chrome: `chrome://extensions` → **Developer mode** → **Load unpacked** → `apps/extension/dist`.
4. Open extension **Options** → save settings → **Sign in** with the same account as the website.

**Chrome Web Store:** `npm run package:extension:store` → upload `apps/extension/release/k12-planner-v0.1.0.zip`. Listing copy: `apps/extension/store/LISTING.txt`. Privacy policy: `https://k12projec.vercel.app/privacy`.

## Maintainer setup (Supabase + Vercel)

### Supabase

1. Create a project at [supabase.com](https://supabase.com/).
2. Run SQL migrations in order: [`20250518000000_init.sql`](supabase/migrations/20250518000000_init.sql), then [`20250519000000_user_preferences.sql`](supabase/migrations/20250519000000_user_preferences.sql).
3. **Authentication → Providers:** enable Email and optionally Google.
4. **Authentication → URL configuration:**
   - **Site URL:** `https://k12projec.vercel.app`
   - **Redirect URLs:** `https://k12projec.vercel.app/auth/callback`
5. Copy **Project URL** and **anon** key from **Settings → API** into Vercel env vars (below).

### Vercel (production)

1. Import this repo on [vercel.com](https://vercel.com); **Root Directory:** `apps/web`.
2. **Environment variables** (Production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://k12projec.vercel.app` (no trailing slash)
3. Deploy from the **repo root** (not `apps/web` alone):

   ```bash
   npm run deploy          # production → https://k12projec.vercel.app
   npm run deploy:preview  # preview URL
   ```

   First time: `npx vercel login` then `npx vercel link` (choose project **k12projec**).

   The site URL above is what students should bookmark.

Optional server-only vars: `SUPABASE_SERVICE_ROLE_KEY` (account deletion in Settings), `ALLOWED_SIGNUP_EMAIL_DOMAINS`, `SIGNUP_INVITE_CODE`.

## Local development (optional)

Only needed if you change code on your own machine. Students do **not** use `localhost`.

```bash
cd k12projec
npm install
cp apps/web/.env.example apps/web/.env.local
# Add Supabase keys; set NEXT_PUBLIC_APP_URL=http://localhost:3000
npm run dev
```

Then add `http://localhost:3000` and `http://localhost:3000/auth/callback` in Supabase **Redirect URLs** (in addition to the production URLs).

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
npm run dev           # web dev server (localhost only)
npm run dev:extension # extension watch build
npm run build         # web + extension
npm run lint          # web ESLint
```

## Author

Built by Jaron Caoili for school coursework planning.
