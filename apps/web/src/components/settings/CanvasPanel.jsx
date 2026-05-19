"use client";

import { apiPaths } from "@k12/shared";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

export function CanvasPanel({ publicConfig, initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [domain, setDomain] = useState(initialStatus?.canvasDomain ?? "");
  const [accessToken, setAccessToken] = useState("");
  const [tokenExpiresAt, setTokenExpiresAt] = useState("");
  const [message, setMessage] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [savingToken, setSavingToken] = useState(false);

  const syncAvailable = publicConfig?.canvasSyncAvailable ?? false;
  const oauthAvailable = publicConfig?.canvasOAuthAvailable ?? false;
  const personalAvailable = publicConfig?.canvasPersonalTokenAvailable ?? true;

  const refreshStatus = useCallback(async () => {
    const res = await fetch(apiPaths.canvasStatus, { credentials: "include" });
    if (res.ok) setStatus(await res.json());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("canvas") === "connected") {
      setMessage("Canvas connected. Run Import now to pull assignments.");
      void refreshStatus();
    }
    if (params.get("canvas") === "error") {
      setMessage("Canvas OAuth failed. Try a personal token below or check your domain.");
    }
  }, [refreshStatus]);

  async function importNow() {
    setSyncing(true);
    setMessage(null);
    const res = await fetch(apiPaths.canvasSync, { method: "POST", credentials: "include" });
    setSyncing(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error ?? "Import failed.");
      return;
    }
    const data = await res.json();
    setMessage(
      `Import complete: ${data.assignments} new assignments, ${data.courses} new courses (${data.updated_courses} Canvas courses checked).`,
    );
    await refreshStatus();
  }

  async function disconnect() {
    setMessage(null);
    await fetch(apiPaths.canvasDisconnect, { method: "DELETE", credentials: "include" });
    setAccessToken("");
    setMessage("Canvas disconnected.");
    await refreshStatus();
  }

  function connectOAuth() {
    const d = domain.trim();
    if (!d) {
      setMessage("Enter your school Canvas domain, e.g. yourschool.instructure.com");
      return;
    }
    window.location.href = `${apiPaths.canvasConnect}?domain=${encodeURIComponent(d)}`;
  }

  async function savePersonalToken() {
    const d = domain.trim();
    const token = accessToken.trim();
    if (!d) {
      setMessage("Enter your Canvas domain first.");
      return;
    }
    if (!token) {
      setMessage("Paste the token from Canvas → Settings → Approved Integrations → details.");
      return;
    }

    setSavingToken(true);
    setMessage(null);
    const res = await fetch(apiPaths.canvasPersonalToken, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canvasDomain: d,
        accessToken: token,
        tokenExpiresAt: tokenExpiresAt || undefined,
      }),
    });
    setSavingToken(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error ?? "Could not save token.");
      return;
    }

    setAccessToken("");
    setMessage("Token saved. Click Import now to pull your courses and assignments.");
    await refreshStatus();
  }

  if (!syncAvailable) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Canvas import is turned off on this server.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-zinc-600 dark:text-zinc-400">
        Imports courses and due dates from Canvas. Does not change grades or submit work in Canvas.
      </p>

      {status?.connected ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="font-medium text-emerald-900 dark:text-emerald-100">
            Connected to {status.canvasDomain}
            {status.authType === "personal" ? " (personal token)" : " (OAuth)"}
          </p>
          {status.tokenExpiresAt ? (
            <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
              Token expires {new Date(status.tokenExpiresAt).toLocaleString()}
            </p>
          ) : null}
          {status.lastSyncedAt ? (
            <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
              Last import {new Date(status.lastSyncedAt).toLocaleString()}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void importNow()} disabled={syncing}>
              {syncing ? "Importing…" : "Import now"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void disconnect()}>
              Disconnect
            </Button>
          </div>
        </div>
      ) : null}

      {!status?.connected && personalAvailable ? (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
            Test with your personal Canvas token
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            In Canvas: <strong>Settings → Approved Integrations</strong> → your token →{" "}
            <strong>details</strong> → copy the access token. Only works for your account. Do not
            share the token. When IT gives a developer key, use OAuth below instead.
          </p>
          <label className="flex flex-col gap-1">
            Canvas domain
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="yourschool.instructure.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Access token
            <input
              type="password"
              autoComplete="off"
              className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Paste token from Canvas details"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            Expires (optional)
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={tokenExpiresAt}
              onChange={(e) => setTokenExpiresAt(e.target.value)}
            />
          </label>
          <Button type="button" onClick={() => void savePersonalToken()} disabled={savingToken}>
            {savingToken ? "Verifying…" : "Save token & connect"}
          </Button>
        </div>
      ) : null}

      {!status?.connected && oauthAvailable ? (
        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">School OAuth (for class beta)</h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Use this after IT approves a developer key. Each student signs in with their own Canvas
            account.
          </p>
          <label className="flex flex-col gap-1">
            Canvas domain
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="yourschool.instructure.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" onClick={connectOAuth}>
            Connect with Canvas login
          </Button>
        </div>
      ) : null}

      {message ? <p className="text-zinc-600 dark:text-zinc-400">{message}</p> : null}
    </div>
  );
}
