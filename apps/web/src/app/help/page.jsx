import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">How to use K12 Planner</h1>
      <p className="mt-3">
        This app helps you track courses, due dates, and study time. Use the live site:{" "}
        <Link className="text-blue-600 hover:underline" href="https://k12projec.vercel.app">
          k12projec.vercel.app
        </Link>
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">1. Sign up</h2>
      <p className="mt-2">
        Create an account with your school email if your teacher gave you an invite code or domain
        requirement. Sign in with email or Google if your school enabled it.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">2. Add courses</h2>
      <p className="mt-2">
        On <strong>Courses</strong>, add each class and set optional current / goal grades. For Canvas
        schools, connect in <strong>Settings</strong> and run <strong>Import now</strong> to pull scores
        and class percentages.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">3. Add assignments</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>On <strong>Today</strong>, use quick add (<kbd className="rounded border px-1">/</kbd>) or the add button</li>
        <li>
          <strong>Canvas:</strong> Settings → Connect Canvas → Import now (if your school enabled
          it)
        </li>
        <li>
          <strong>Google Classroom:</strong> install the Chrome extension and click Save on an
          assignment page
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">4. Chrome extension</h2>
      <p className="mt-2">
        Ask your teacher for the K12 Planner extension link. After installing, open extension{" "}
        <strong>Options</strong>, set the app URL to <code>https://k12projec.vercel.app</code>, and
        sign in with the same account as the website.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">5. Schedule & focus</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>
          <strong>Today:</strong> stat blocks (overdue, due today, soon, study hours).{" "}
          <strong>Courses:</strong> GPA, per-class work, schedule redo.
        </li>
        <li>
          <strong>Schedule:</strong> week view and plan my day (title + time, add or delete blocks).
        </li>
        <li>
          <strong>Focus:</strong> study timer and your next block — edit blocks on Schedule.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">6. Reminders</h2>
      <p className="mt-2">
        In <strong>Settings</strong>, turn on browser or email reminders and choose 24h / 2h before
        due dates.
      </p>

      <p className="mt-10">
        <Link className="font-medium text-blue-600 hover:underline" href="/login">
          Sign in
        </Link>
        {" · "}
        <Link className="font-medium text-blue-600 hover:underline" href="/privacy">
          Privacy policy
        </Link>
      </p>
    </div>
  );
}
