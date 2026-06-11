"use client";

import { apiPaths } from "@k12/shared";
import { useState } from "react";

export function CourseGradeFields({ course, onSaved, embedded = false }) {
  const [target, setTarget] = useState(
    course.target_grade_percent != null ? String(course.target_grade_percent) : "80",
  );
  const [credits, setCredits] = useState(
    course.credit_hours != null ? String(course.credit_hours) : "1",
  );
  const [weighted, setWeighted] = useState(Boolean(course.is_weighted));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(apiPaths.course(course.id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_grade_percent: target === "" ? null : Number(target),
        credit_hours: credits === "" ? 1 : Number(credits),
        is_weighted: weighted,
      }),
    });
    setSaving(false);
    if (res.ok) onSaved?.();
  }

  const inner = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1 text-xs">
        <span className="text-zinc-500">Current grade</span>
        <span className="py-1 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {course.current_grade_percent != null ? `${course.current_grade_percent}%` : "—"}
        </span>
      </div>
      <label className="flex flex-col gap-1 text-xs">
        <span>Goal %</span>
        <input
          type="number"
          min={0}
          max={100}
          step={0.1}
          className="w-20 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span>Credits</span>
        <input
          type="number"
          min={0.5}
          max={10}
          step={0.5}
          className="w-16 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
        />
      </label>
      <label className="flex items-center gap-1.5 pb-1 text-xs">
        <input type="checkbox" checked={weighted} onChange={(e) => setWeighted(e.target.checked)} />
        Weighted (AP/honors)
      </label>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save()}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );

  if (embedded) return inner;

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Grades & GPA</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Your grade pulls automatically from Canvas every sync. Set a goal and credits for GPA.
      </p>
      <div className="mt-2">{inner}</div>
    </div>
  );
}
