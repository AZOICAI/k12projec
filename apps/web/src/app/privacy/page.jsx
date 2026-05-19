import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Privacy policy</h1>
      <p className="mt-4">
        K12 Planner helps students organize courses, assignments, and study time. This policy
        describes what we collect, how we use it, and your choices. The app is operated as a school
        beta project using Supabase for sign-in and secure storage.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">Who can sign up</h2>
      <p className="mt-2">
        During the beta, sign-up may be limited to approved school email domains or an invite code
        set by the project owner. If you believe you should have access, contact your teacher or
        the project administrator.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">What we collect</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>Account: email and password, or Google sign-in (via Supabase Auth)</li>
        <li>Planner data you enter: courses, assignments, study blocks, meeting times, notes</li>
        <li>Optional: assignment source URL when saved from the Chrome extension on Classroom</li>
        <li>Preferences: timezone and reminder settings you choose in Settings</li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">What we do not do</h2>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>We do not sell your data or show ads based on your planner content.</li>
        <li>We do not run remote code in the extension — only bundled scripts from the store package.</li>
        <li>Canvas automatic sync is not enabled yet; we do not connect to Canvas on your behalf in this version.</li>
        <li>We do not grade you or share your planner with teachers unless you choose to show them.</li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">Chrome extension</h2>
      <p className="mt-2">
        The optional extension can read assignment titles and due dates on Google Classroom pages you
        open, only when you use “Save to K12 Planner.” It sends that data to your account over HTTPS.
        You can disable or uninstall the extension at any time.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">Data retention and deletion</h2>
      <p className="mt-2">
        You can delete individual assignments and courses in the app. To remove your entire account
        and all associated data, use <strong>Delete my account</strong> in Settings (requires server
        configuration). After deletion, your sign-in is removed and planner rows are deleted via
        database rules tied to your account.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">Security</h2>
      <p className="mt-2">
        Data is stored in Supabase (PostgreSQL) with row-level security so each user only sees their
        own rows. Use a strong password and do not share your login. Report security concerns to the
        contact listed on the sign-up page or your school sponsor.
      </p>

      <h2 className="mt-8 text-lg font-medium text-zinc-900 dark:text-zinc-50">Children and schools</h2>
      <p className="mt-2">
        This beta is intended for student use with teacher or administrator awareness. Parents and
        school staff may request information about what students store in the planner by contacting
        the project owner.
      </p>

      <p className="mt-8">
        <Link className="text-blue-600 hover:underline" href="/login">
          Back to sign in
        </Link>
      </p>
      <p className="mt-4 text-zinc-500">Last updated: May 2026</p>
    </div>
  );
}
