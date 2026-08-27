"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";
import { filterRecentAssignments } from "@/lib/progress";

const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "redo", label: "Redo" },
  { value: "low_grade", label: "Low grade" },
];

export default function AssignmentsPage() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [title, setTitle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [estimate, setEstimate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(() => {
    const visible = showAll ? assignments : filterRecentAssignments(assignments);

    return [...visible].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
  }, [assignments, showAll]);

  async function load() {
    setError(null);
    const [cRes, aRes] = await Promise.all([
      fetch(apiPaths.courses, { credentials: "include" }),
      fetch(apiPaths.assignments, { credentials: "include" }),
    ]);
    if (!cRes.ok) {
      setError(await cRes.text());
      setLoading(false);
      return;
    }
    if (!aRes.ok) {
      setError(await aRes.text());
      setLoading(false);
      return;
    }
    const cJson = await cRes.json();
    setCourses(cJson.map(({ id, user_id, term_id, name, color, created_at }) => ({ id, user_id, term_id, name, color, created_at })));
    setAssignments(await aRes.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (courses.length && !courseName) {
      setCourseName(courses[0]?.name ?? "");
    }
  }, [courses, courseName]);

  async function resolveCourseId() {
    const trimmed = courseName.trim();
    if (!trimmed) return null;

    const existing = courses.find((course) => course.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const res = await fetch(apiPaths.courses, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        color: "#60a5fa",
      }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const created = await res.json();
    setCourses((current) => [...current, created]);
    return created.id;
  }

  async function addAssignment(e) {
    e.preventDefault();
    const trimmedCourse = courseName.trim();
    if (!trimmedCourse) {
      setError("Add a course name before scheduling the assignment.");
      return;
    }
    setError(null);

    let courseId;
    try {
      courseId = await resolveCourseId();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save the course.");
      return;
    }

    if (!courseId) {
      setError("A course is required for the assignment.");
      return;
    }

    const due_at = new Date(dueLocal).toISOString();
    const res = await fetch(apiPaths.assignments, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        title,
        due_at,
        notes: notes || null,
        estimate_minutes: estimate ? Number(estimate) : null,
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setTitle("");
    setCourseName("");
    setNotes("");
    setEstimate("");
    setDueLocal("");
    await load();
  }

  async function patchStatus(id, status) {
    setError(null);
    const res = await fetch(apiPaths.assignment(id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function remove(id) {
    setError(null);
    const res = await fetch(apiPaths.assignment(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Assignments</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Track everything that is due and update status as you go.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {showAll ? "Showing all assignments." : "Showing recent work only."}
        </p>
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          {showAll ? "Hide old" : "Show all"}
        </button>
      </div>

      <form
        onSubmit={addAssignment}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Title</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Course</span>
            <input
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Type a class name"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Due</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Estimate (minutes)</span>
            <input
              type="number"
              min={0}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            className="min-h-[72px] rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button type="submit" className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add assignment
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No assignments yet. Add your first one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sorted.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.title}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: a.courses?.color ?? "#3B82F6" }}
                      />
                      {a.courses?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{new Date(a.due_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-900"
                      value={a.status}
                      onChange={(e) => void patchStatus(a.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" className="text-xs font-medium text-emerald-600 hover:underline" onClick={() => void patchStatus(a.id, "done")}>
                        Complete
                      </button>
                      <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void remove(a.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
