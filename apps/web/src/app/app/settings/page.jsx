"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiPaths } from "@k12/shared";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CanvasPanel } from "@/components/settings/CanvasPanel";
import { TermsPanel } from "@/components/courses/TermsPanel";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [timezone, setTimezone] = useState("America/New_York");
  const [webNotif, setWebNotif] = useState(false);
  const [extNotif, setExtNotif] = useState(false);
  const [emailReminders, setEmailReminders] = useState(false);
  const [remind24, setRemind24] = useState(true);
  const [remind2, setRemind2] = useState(true);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [publicConfig, setPublicConfig] = useState(null);
  const [canvasStatus, setCanvasStatus] = useState(null);

  useEffect(() => {
    void (async () => {
      const [prefRes, cfgRes, canvasRes] = await Promise.all([
        fetch(apiPaths.preferences, { credentials: "include" }),
        fetch(apiPaths.publicConfig),
        fetch(apiPaths.canvasStatus, { credentials: "include" }),
      ]);
      if (prefRes.ok) {
        const p = await prefRes.json();
        setTimezone(p.timezone ?? "America/New_York");
        setWebNotif(p.web_notifications_enabled ?? false);
        setExtNotif(p.extension_notifications_enabled ?? false);
        setEmailReminders(p.email_reminders_enabled ?? false);
        const hours = p.remind_before_hours ?? [24, 2];
        setRemind24(hours.includes(24));
        setRemind2(hours.includes(2));
      }
      if (cfgRes.ok) setPublicConfig(await cfgRes.json());
      if (canvasRes.ok) setCanvasStatus(await canvasRes.json());
      setLoading(false);
    })();
  }, [searchParams]);

  async function requestBrowserPermission() {
    if (!("Notification" in window)) {
      setMessage("This browser does not support notifications.");
      return;
    }
    const perm = await Notification.requestPermission();
    setMessage(perm === "granted" ? "Notifications allowed." : `Permission: ${perm}`);
  }

  async function save(e) {
    e.preventDefault();
    setMessage(null);
    const remind_before_hours = [];
    if (remind24) remind_before_hours.push(24);
    if (remind2) remind_before_hours.push(2);

    const res = await fetch(apiPaths.preferences, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timezone,
        web_notifications_enabled: webNotif,
        extension_notifications_enabled: extNotif,
        email_reminders_enabled: emailReminders,
        remind_before_hours,
      }),
    });
    if (!res.ok) {
      let errText = "Could not save settings.";
      try {
        const err = await res.json();
        errText = err.error ?? errText;
      } catch {
        errText = await res.text();
      }
      setMessage(errText);
      return;
    }
    setMessage("Settings saved.");
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setMessage("Type DELETE in the box below to confirm account removal.");
      return;
    }
    setDeleting(true);
    setMessage(null);
    const res = await fetch(apiPaths.account, { method: "DELETE", credentials: "include" });
    setDeleting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Could not delete account." }));
      setMessage(err.error ?? "Could not delete account. Ask your administrator.");
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) return <p className="text-sm text-zinc-500">Loading settings…</p>;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Reminders, Canvas import, and your data.{" "}
          <Link href="/help" className="text-blue-600 hover:underline">
            Help
          </Link>
        </p>
      </div>

      <Card as="form" onSubmit={save} className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Reminders</h2>
        <label className="flex flex-col gap-1 text-sm">
          Timezone
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/New_York"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={webNotif} onChange={(e) => setWebNotif(e.target.checked)} />
          Browser reminders while the planner tab is open
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={extNotif} onChange={(e) => setExtNotif(e.target.checked)} />
          Chrome extension due-soon notifications
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={emailReminders}
            onChange={(e) => setEmailReminders(e.target.checked)}
          />
          Email reminders (hourly check; requires server setup)
        </label>

        <fieldset className="text-sm">
          <legend className="mb-2 font-medium">Remind me before due date</legend>
          <label className="mr-4 inline-flex items-center gap-2">
            <input type="checkbox" checked={remind24} onChange={(e) => setRemind24(e.target.checked)} />
            24 hours
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={remind2} onChange={(e) => setRemind2(e.target.checked)} />
            2 hours
          </label>
        </fieldset>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={requestBrowserPermission}>
            Allow browser notifications
          </Button>
          <Button type="submit">Save settings</Button>
        </div>

        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </Card>

      <CollapsibleSection title="School terms" summary="Optional semesters" defaultOpen={false}>
        <TermsPanel />
      </CollapsibleSection>

      <Card className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Canvas LMS</h2>
        <CanvasPanel publicConfig={publicConfig} initialStatus={canvasStatus} />
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Privacy</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Read what we collect and how deletion works.
        </p>
        <Link href="/privacy" className="text-sm font-medium text-blue-600 hover:underline">
          Privacy policy
        </Link>
      </Card>

      <Card className="flex flex-col gap-3 border-red-200 dark:border-red-900">
        <h2 className="text-sm font-semibold text-red-800 dark:text-red-200">Delete account</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Permanently removes your sign-in and all courses, assignments, and study blocks. This
          cannot be undone.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          Type DELETE to confirm
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            autoComplete="off"
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          className="!border-red-300 !text-red-700 dark:!border-red-800 dark:!text-red-300"
          disabled={deleting}
          onClick={() => void deleteAccount()}
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </Button>
      </Card>
    </div>
  );
}
