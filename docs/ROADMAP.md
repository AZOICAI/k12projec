# Product roadmap (future)

Tracked ideas — implement incrementally. See `// TODO(future):` in code.

| Feature | Status | Notes |
|---------|--------|-------|
| AI study schedule | Planned | Edge function + LLM; input assignments + study blocks |
| “What should I work on now?” | Planned | Rank by due date, estimate, status |
| Google Calendar sync | Planned | OAuth + two-way or export |
| Canvas / Schoology parsers | Planned | Like Classroom content script in extension |
| Productivity analytics | Planned | Charts from `/api/v1/dashboard/summary` history |
| Smart push (tab closed) | Planned | Supabase Edge Function or Vercel Cron |
| Gamification / streaks | Planned | `user_stats` table |
| Study groups | Planned | Shared RLS policies |
| FastAPI backend | Learning | See `docs/future-fastapi.md` |

## Shipped in growth roadmap

- Design system components + mobile app shell
- Dashboard stats, progress bar, upcoming deadlines
- User preferences + browser/extension reminders (v1)
- Quick-add drawer (`/` shortcut)
- Unified calendar (assignments + study + class meetings)
- Assignment inline edit
- Terms / semesters UI
- Extension: token refresh, notifications, context menu save, Classroom button
- `source_url` on assignments
