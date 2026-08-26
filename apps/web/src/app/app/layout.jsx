import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

function SignOutForm() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
      >
        Sign out
      </button>
    </form>
  );
}

export default async function AppLayout({ children }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/app" className="font-semibold tracking-tight">
              K12 Planner
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/app">
                Home
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/app/courses">
                Courses
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/app/assignments">
                Assignments
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/app/calendar">
                Calendar
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/app/study">
                Study
              </Link>
              <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/app/progress">
                Progress
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="hidden sm:inline">{user?.email}</span>
            <SignOutForm />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
