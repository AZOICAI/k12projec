"use client";

/**
 * Purpose: Fast assignment entry from the dashboard (Phase 2).
 */

import { apiPaths } from "@k12/shared";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function QuickAddDrawer({ defaultCourseId = null, pushUndo }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [estimate, setEstimate] = useState("");
  const [isRedo, setIsRedo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "/" && !e.target.closest("input, textarea")) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetch(apiPaths.courses, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => {
        setCourses(list);
        if (defaultCourseId && list.some((c) => c.id === defaultCourseId)) {
          setCourseId(defaultCourseId);
        } else if (list.length) {
          setCourseId(list[0].id);
        }
      });
  }, [open, defaultCourseId]);

  async function submit(e) {
    e.preventDefault();
    if (!courseId) {
      setError("Add a class first on the Courses tab.");
      return;
    }
    if (!dueLocal) return;
    setSaving(true);
    setError(null);
    const res = await fetch(apiPaths.assignments, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        title,
        due_at: new Date(dueLocal).toISOString(),
        estimate_minutes: estimate ? Number(estimate) : null,
        is_redo: isRedo,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const created = await res.json().catch(() => null);
    if (created?.id) {
      pushUndo?.({
        label: "quick add",
        run: async () => {
          await fetch(apiPaths.assignment(created.id), {
            method: "DELETE",
            credentials: "include",
          });
        },
      });
    }
    setTitle("");
    setEstimate("");
    setIsRedo(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        + Quick add
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <Card as="form" onSubmit={submit} className="w-full max-w-md flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Quick add assignment</h2>
              <button
                type="button"
                className="text-zinc-500 hover:text-zinc-800"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="e.g. Essay redo, missing worksheet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
              required
            />
            <input
              type="number"
              min={0}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Estimate (minutes, optional)"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" checked={isRedo} onChange={(e) => setIsRedo(e.target.checked)} />
              Makeup / redo work
            </label>
            {courses.length === 0 ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Add a class first on the Courses tab.
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Add assignment"}
            </Button>
            <p className="text-xs text-zinc-500">Tip: press / to open quick add</p>
          </Card>
        </div>
      ) : null}
    </>
  );
}
