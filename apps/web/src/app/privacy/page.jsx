export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Privacy policy</h1>
      <p className="mt-4">
        K12 Planner stores your account email, courses, assignments, and study blocks so you can
        organize schoolwork across devices. We use Supabase for authentication and database hosting.
      </p>
      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">What we collect</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>Email and password (or Google sign-in via Supabase Auth)</li>
        <li>Planner data you enter: courses, assignments, study blocks, optional notes</li>
      </ul>
      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">What we do not do</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>We do not sell your data.</li>
        <li>We do not read third-party LMS pages (Google Classroom, Canvas) in this version.</li>
      </ul>
      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">Your choices</h2>
      <p className="mt-2">
        You can delete assignments and courses in the app, or delete your account through Supabase
        project settings if you self-host. Contact your administrator for hosted deployments.
      </p>
      <p className="mt-8 text-zinc-500">Last updated: May 2026</p>
    </div>
  );
}
