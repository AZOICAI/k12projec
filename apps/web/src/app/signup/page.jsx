"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("Check your email to confirm, then sign in.");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Start organizing coursework with cloud sync.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {message ? <p className="text-sm text-zinc-700 dark:text-zinc-300">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link className="font-medium text-blue-600 hover:underline" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
