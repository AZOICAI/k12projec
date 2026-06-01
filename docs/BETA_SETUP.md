# School beta setup (maintainer)

Production: [https://k12projec.vercel.app](https://k12projec.vercel.app)

## Supabase migrations

Run in the SQL editor, in order:

1. `supabase/migrations/20250518000000_init.sql`
2. `supabase/migrations/20250519000000_user_preferences.sql`
3. `supabase/migrations/20250520000000_canvas.sql`
4. `supabase/migrations/20250521000000_canvas_personal_token.sql`
5. `supabase/migrations/20250522000000_assistant_features.sql` (grades, starters, study notes)
6. `supabase/migrations/20250531000000_assignment_recovery.sql` (redo flag — column `is_recovery`, shown as Redo in the app)
7. `supabase/migrations/20250532000000_assignment_low_grade.sql` (optional manual low-grade flag)
8. `supabase/migrations/20250533000000_assignment_grades.sql` (scores + redo link from Canvas)
9. `supabase/migrations/20250534000000_course_gpa.sql` (credit hours + weighted GPA per class)
10. `supabase/migrations/20250535000000_study_sessions.sql` (Focus timer logged study time)

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

## Auth redirect URLs (Supabase) — required for sign-up / Google login

In **Supabase → Authentication → URL configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://k12projec.vercel.app` (not `localhost` for production users) |
| **Redirect URLs** (add each) | `https://k12projec.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` (only for local dev) |

If **Site URL** is `http://localhost:3000`, confirmation emails send friends to localhost → browser shows **“This site can’t be reached.”**

**Email confirmations:** Authentication → Providers → Email → ensure “Confirm email” matches your beta plan. If enabled, users must click the email link before password sign-in works.

**Google:** Enable Google provider and add the same redirect URLs.

**Vercel:** `NEXT_PUBLIC_APP_URL` must be `https://k12projec.vercel.app` (no trailing slash).

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
