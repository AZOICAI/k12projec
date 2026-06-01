"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiPaths } from "@k12/shared";
import { getAuthCallbackUrl } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch(apiPaths.publicConfig)
      .then((r) => (r.ok ? r.json() : null))
      .then(setPolicy);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!agreedPrivacy) {
      setMessage("Please agree to the privacy policy to continue.");
      return;
    }
    const check = await fetch(apiPaths.validateSignup, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, inviteCode }),
    });
    if (!check.ok) {
      const err = await check.json().catch(() => ({}));
      setMessage(err.error ?? "Sign-up is not allowed for this email or invite code.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const emailRedirectTo = getAuthCallbackUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    if (data.session) {
      setMessage("Account created — redirecting…");
      router.push("/app");
      router.refresh();
      return;
    }
    const site = typeof window !== "undefined" ? window.location.origin : "";
    setMessage(
      `Check your email to confirm your account, then sign in. The link should open ${site || "this site"} — if it says the site can't be reached, ask your teacher to fix Supabase Site URL settings.`,
    );
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {policy?.isBeta
            ? "School beta — use your school email if required below."
            : "Start organizing coursework with cloud sync."}
        </p>
        {policy?.emailRestrictionEnabled && policy.allowedDomainHint ? (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Allowed email domains: @{policy.allowedDomainHint.replace(/, /g, ", @")}
          </p>
        ) : null}
      </div>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
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
        {policy?.inviteCodeRequired ? (
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Beta invite code</span>
            <input
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
            />
          </label>
        ) : null}
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
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={agreedPrivacy}
            onChange={(e) => setAgreedPrivacy(e.target.checked)}
          />
          <span>
            I have read the{" "}
            <Link className="font-medium text-blue-600 hover:underline" href="/privacy">
              privacy policy
            </Link>{" "}
            and understand this is a school beta.
          </span>
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
