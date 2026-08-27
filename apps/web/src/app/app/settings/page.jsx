"use client";

import { useEffect, useState } from "react";
import {
  getLocalAccount,
  getLocalDevSessionUsername,
  upsertLocalAccount,
} from "@/lib/dev-auth";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [canvasAccessKey, setCanvasAccessKey] = useState("");
  const [canvasSchoolUrl, setCanvasSchoolUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUsername = getLocalDevSessionUsername();
    if (!currentUsername) {
      setLoading(false);
      setStatus("Sign in to save your Canvas settings.");
      return;
    }

    const account = getLocalAccount(currentUsername);
    setUsername(currentUsername);
    setCanvasAccessKey(account?.canvasAccessKey ?? "");
    setCanvasSchoolUrl(account?.canvasSchoolUrl ?? "");
    setLoading(false);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const currentUsername = getLocalDevSessionUsername();

    if (!currentUsername) {
      setStatus("You need to sign in before saving settings.");
      return;
    }

    const trimmedKey = canvasAccessKey.trim();
    const trimmedSchoolUrl = canvasSchoolUrl.trim();

    upsertLocalAccount(currentUsername, {
      canvasAccessKey: trimmedKey,
      canvasSchoolUrl: trimmedSchoolUrl,
    });

    setStatus("Canvas access settings saved locally.");
  }

  function clearCanvasSettings() {
    const currentUsername = getLocalDevSessionUsername();
    if (!currentUsername) {
      setStatus("Sign in to clear saved Canvas settings.");
      return;
    }

    upsertLocalAccount(currentUsername, {
      canvasAccessKey: "",
      canvasSchoolUrl: "",
    });
    setCanvasAccessKey("");
    setCanvasSchoolUrl("");
    setStatus("Saved Canvas settings cleared.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">School & Canvas sync</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Save your Canvas access key and school URL here so your planner can connect to your K12 course data.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-semibold text-zinc-900 dark:text-zinc-100">{username || "Unknown user"}</span>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            <span className="mb-1 block">Canvas school URL</span>
            <input
              value={canvasSchoolUrl}
              onChange={(e) => setCanvasSchoolUrl(e.target.value)}
              placeholder="https://school.instructure.com"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="block text-sm font-medium">
            <span className="mb-1 block">Canvas access key</span>
            <input
              value={canvasAccessKey}
              onChange={(e) => setCanvasAccessKey(e.target.value)}
              type="password"
              placeholder="Paste your Canvas token here"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Save Canvas settings
            </button>
            <button
              type="button"
              onClick={clearCanvasSettings}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Clear saved key
            </button>
          </div>
        </form>

        {status ? <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{status}</p> : null}

        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          This stores the token in your browser local storage so your saved account remembers it on future sign-ins.
        </div>
      </div>
    </div>
  );
}
