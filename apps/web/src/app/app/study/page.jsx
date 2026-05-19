"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";

export default function StudyPage() {
  const [blocks, setBlocks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [title, setTitle] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [courseId, setCourseId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const sorted = useMemo(
    () => [...blocks].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()),
    [blocks],
  );

  async function load() {
    setError(null);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 21);
    to.setHours(23, 59, 59, 999);
    const q = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    const [bRes, cRes, aRes] = await Promise.all([
      fetch(`${apiPaths.studyBlocks}?${q}`, { credentials: "include" }),
      fetch(apiPaths.courses, { credentials: "include" }),
      fetch(apiPaths.assignments, { credentials: "include" }),
    ]);
    if (!bRes.ok || !cRes.ok || !aRes.ok) {
      const t = await (bRes.ok ? cRes : bRes).text();
      setError(t);
      setLoading(false);
      return;
    }
    setBlocks(await bRes.json());
    const cJson = await cRes.json();
    setCourses(cJson);
    setAssignments(await aRes.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addBlock(e) {
    e.preventDefault();
    setError(null);
    const res = await fetch(apiPaths.studyBlocks, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        starts_at: new Date(startsLocal).toISOString(),
        ends_at: new Date(endsLocal).toISOString(),
        course_id: courseId || null,
        assignment_id: assignmentId || null,
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    setTitle("");
    setCourseId("");
    setAssignmentId("");
    await load();
  }

  async function remove(id) {
    setError(null);
    const res = await fetch(apiPaths.studyBlock(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Study planner</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Block out focused study time. Optionally link a course or assignment.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={addBlock}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Starts</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={startsLocal}
              onChange={(e) => setStartsLocal(e.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Ends</span>
            <input
              type="datetime-local"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={endsLocal}
              onChange={(e) => setEndsLocal(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Course (optional)</span>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">—</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Assignment (optional)</span>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
            >
              <option value="">—</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Add study block
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No study blocks in the next three weeks.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950">
          {sorted.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <div className="font-medium">{b.title}</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {new Date(b.starts_at).toLocaleString()} – {new Date(b.ends_at).toLocaleString()}
                </div>
              </div>
              <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void remove(b.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
