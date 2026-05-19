# K12 Planner web app

Next.js app for the monorepo. **Students use the deployed site:** [https://k12projec.vercel.app](https://k12projec.vercel.app)

Full setup (Supabase, Vercel, extension) is in the [root README](../../README.md).

To run the app on your own machine while developing (optional):

```bash
# From repo root
npm install
cp apps/web/.env.example apps/web/.env.local
npm run dev
```

Then open `http://localhost:3000` on **your** computer only — not the URL you share with classmates.
