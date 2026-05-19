# Canvas LMS setup (school IT)

K12 Planner imports courses and assignment due dates from Canvas. It does **not** change grades or submit work in Canvas.

## What you need from IT

1. **Canvas developer key** (OAuth2) for your institution’s Canvas domain, e.g. `yourschool.instructure.com`.
2. **Redirect URI** (exact):
   ```
   https://k12projec.vercel.app/api/v1/canvas/callback
   ```
3. Scopes (typical): read courses, read assignments (Canvas API scopes vary by key type).

## Environment variables (Vercel)

Set after IT approves the key:

- `CANVAS_CLIENT_ID`
- `CANVAS_CLIENT_SECRET`
- `CANVAS_REDIRECT_URI` = `https://k12projec.vercel.app/api/v1/canvas/callback`

Students connect in **Settings → Canvas LMS → Connect Canvas**, then **Import now**.

## Student flow (OAuth — after IT approves developer key)

1. Sign in at [https://k12projec.vercel.app](https://k12projec.vercel.app)
2. Settings → **Connect with Canvas login**
3. Import now — creates/updates courses and assignments
4. Re-import anytime; duplicates are merged by Canvas assignment ID

## Solo testing (personal access token)

Until IT gives a developer key, you can test with **your own** token:

1. In Canvas: **Settings → Approved Integrations** → your token → **details** → copy access token
2. In K12 Planner: **Settings → Test with your personal Canvas token**
3. Enter your Canvas domain (e.g. `yourschool.instructure.com`), paste the token, optional expiry
4. **Save token & connect** → **Import now**

Personal tokens expire (often in days) and only work for **your** account. Do not share them. For a class beta, use OAuth instead.

## Privacy

Tokens are stored server-side only (not in the browser). Disconnect in Settings removes the connection row.
