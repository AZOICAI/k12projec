# School beta setup (maintainer)

Production: [https://k12projec.vercel.app](https://k12projec.vercel.app)

## Supabase migrations

Run in the SQL editor, in order:

1. `supabase/migrations/20250518000000_init.sql`
2. `supabase/migrations/20250519000000_user_preferences.sql`
3. `supabase/migrations/20250520000000_canvas.sql`
4. `supabase/migrations/20250521000000_canvas_personal_token.sql`

## Vercel environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://k12projec.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Account deletion + Canvas token storage |
| `ALLOWED_SIGNUP_EMAIL_DOMAINS` | Beta | Comma-separated, e.g. `myschool.edu` |
| `SIGNUP_INVITE_CODE` | Optional | Extra gate for sign-up |
| `CRON_SECRET` | Reminders | Random string; Vercel Cron sends `Authorization: Bearer …` |
| `RESEND_API_KEY` | Optional | Email reminders when tab is closed |
| `REMINDER_FROM_EMAIL` | Optional | e.g. `reminders@yourdomain.com` |
| `CANVAS_CLIENT_ID` | Canvas | From school IT developer key |
| `CANVAS_CLIENT_SECRET` | Canvas | Keep secret |
| `CANVAS_REDIRECT_URI` | Canvas | `https://k12projec.vercel.app/api/v1/canvas/callback` |

## Auth redirect URLs (Supabase)

- Site URL: `https://k12projec.vercel.app`
- Redirect: `https://k12projec.vercel.app/auth/callback`

## Verify account deletion

1. Set `SUPABASE_SERVICE_ROLE_KEY` on Vercel.
2. Sign in → Settings → type `DELETE` → confirm.

## Weekly beta metrics (SQL)

```sql
select count(*) as users from auth.users;
select count(*) as with_courses from (
  select user_id from courses group by user_id
) t;
select count(*) as canvas_connected from canvas_connections;
```
