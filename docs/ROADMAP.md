# Product roadmap

## Shipped (school beta growth plan)

- Beta signup controls (email domain, invite code) + privacy / account deletion
- Student help page (`/help`) + onboarding checklist
- **Canvas:** OAuth connect, import courses/assignments, dedupe by Canvas ID ([`docs/CANVAS_SETUP.md`](CANVAS_SETUP.md))
- **Work on now** dashboard card (overdue → today → soon)
- **Email reminders** v2 (Vercel Cron + optional Resend)
- Maintainer docs: [`BETA_SETUP.md`](BETA_SETUP.md)

## Shipped earlier

- Design system + mobile app shell
- Dashboard stats, progress, upcoming deadlines
- User preferences + browser/extension reminders (v1)
- Quick-add (`/`), unified calendar, assignment inline edit
- Terms UI, Classroom extension + `source_url`

## Phase 4 — after beta metrics (do not start yet)

| Feature | Notes |
|---------|--------|
| Gamification / streaks | `user_stats`; careful tone for schools |
| Google Calendar sync | OAuth heavy; `.ics` export first |
| Productivity analytics | Needs historical snapshots |
| AI study schedule | Cost + trust |
| Study groups | Shared RLS |
| Canvas extension content script | Optional; API import covers beta |
| Schoology parser | Like Classroom |
| FastAPI backend | Learning — [`future-fastapi.md`](future-fastapi.md) |
