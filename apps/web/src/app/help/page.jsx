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
        Go to <strong>Courses</strong> and add each class. Pick a color so the calendar is easy to
        read.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">3. Add assignments</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>Type them under <strong>Assignments</strong></li>
        <li>On the dashboard, press <kbd className="rounded border px-1">/</kbd> for quick add</li>
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

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">5. Reminders</h2>
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
