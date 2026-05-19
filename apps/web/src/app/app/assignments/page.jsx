"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";
import { AssignmentRow } from "@/components/assignments/AssignmentRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function AssignmentsPage() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [notes, setNotes] = useState("");
  const [estimate, setEstimate] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(
    () => [...assignments].sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime()),
    [assignments],
  );

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
    if (courses.length && !courseId) {
      setCourseId(courses[0].id);
    }
  }, [courses, courseId]);

  async function addAssignment(e) {
    e.preventDefault();
    if (!courseId) return;
    setError(null);
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
    setNotes("");
    setEstimate("");
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
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
        <ListSkeleton rows={5} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No assignments yet"
          description="Add your first assignment above or use Quick add on the dashboard."
          actionHref="/app"
          actionLabel="Go to dashboard"
        />
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
                <AssignmentRow
                  key={a.id}
                  assignment={a}
                  courses={courses}
                  onUpdated={load}
                  onDelete={() => void remove(a.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
