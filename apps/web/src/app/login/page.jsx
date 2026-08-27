"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  readLocalAccounts,
  setLocalDevSession,
} from "@/lib/dev-auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setMessage("Enter your username.");
      return;
    }

    setLoading(true);
    setMessage("");

    const accounts = readLocalAccounts();
    const account = accounts[trimmedUsername];

    if (!account || account.password !== password) {
      setLoading(false);
      setMessage("Invalid username or password.");
      return;
    }

    setLocalDevSession(trimmedUsername, rememberMe);
    setLoading(false);
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">K12 Planner</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with your username and password.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Username</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            Show password
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
        </div>
        {message ? <p className="text-sm text-red-600">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Need an account?{" "}
        <Link className="font-medium text-blue-600 hover:underline" href="/signup">
          Create one
        </Link>
      </p>
      <p className="text-center text-xs text-zinc-500">
        <Link className="hover:underline" href="/privacy">
          Privacy policy
        </Link>
      </p>
    </div>
  );
}
