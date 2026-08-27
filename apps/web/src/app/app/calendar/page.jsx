"use client";

import { apiPaths } from "@k12/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { checkRankUp, updateStoredRank } from "@/lib/xp";
import RankUpPopup from "@/components/RankUpPopup";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeekMonday(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentCourseName, setAssignmentCourseName] = useState("");
  const [assignmentDueLocal, setAssignmentDueLocal] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [studyTitle, setStudyTitle] = useState("");
  const [startsLocal, setStartsLocal] = useState("");
  const [endsLocal, setEndsLocal] = useState("");
  const [courseId, setCourseId] = useState("");
  const [error, setError] = useState(null);
  const [rankUpRank, setRankUpRank] = useState(null);

  const weekEnd = useMemo(() => {
    const end = addDays(weekStart, 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [weekStart]);

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const byDay = useMemo(() => {
    const map = {};
    for (const day of days) {
      const key = day.toDateString();
      map[key] = [];
    }

    for (const item of assignments) {
      const due = new Date(item.due_at);
      const key = new Date(due.getFullYear(), due.getMonth(), due.getDate()).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push({ ...item, itemType: "assignment" });
    }

    for (const block of studyBlocks) {
      const dayStart = new Date(block.starts_at);
      const key = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate()).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push({ ...block, itemType: "study" });
    }

    return map;
  }, [assignments, studyBlocks, days]);

  const load = useCallback(async () => {
    setError(null);
    const from = weekStart.toISOString();
    const to = weekEnd.toISOString();
    const q = new URLSearchParams({ from, to });
    const [aRes, sRes, cRes] = await Promise.all([
      fetch(`${apiPaths.assignments}?${q}`, { credentials: "include" }),
      fetch(`${apiPaths.studyBlocks}?${q}`, { credentials: "include" }),
      fetch(apiPaths.courses, { credentials: "include" }),
    ]);

    if (!aRes.ok || !sRes.ok || !cRes.ok) {
      const problem = !aRes.ok ? aRes : !sRes.ok ? sRes : cRes;
      setError(await problem.text());
      return;
    }

    setAssignments(await aRes.json());
    setStudyBlocks(await sRes.json());
    setCourses(await cRes.json());
  }, [weekStart, weekEnd]);

  useEffect(() => {
    void load();
    void updateStoredRank();
  }, [load]);

  async function resolveCourseId(courseNameValue) {
    const trimmed = String(courseNameValue ?? "").trim();
    if (!trimmed) return null;

    const existing = courses.find((course) => course.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const res = await fetch(apiPaths.courses, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, color: "#60a5fa" }),
    });

    if (!res.ok) throw new Error(await res.text());

    const created = await res.json();
    setCourses((current) => [...current, created]);
    return created.id;
  }

  async function addAssignment(e) {
    e.preventDefault();
    if (!assignmentTitle || !assignmentDueLocal) return;

    const courseId = await resolveCourseId(assignmentCourseName);
    if (!courseId) {
      setError("Enter a course name for this assignment.");
      return;
    }

    const res = await fetch(apiPaths.assignments, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        course_id: courseId,
        title: assignmentTitle,
        due_at: new Date(assignmentDueLocal).toISOString(),
        notes: assignmentNotes || null,
      }),
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    setAssignmentTitle("");
    setAssignmentCourseName("");
    setAssignmentDueLocal("");
    setAssignmentNotes("");
    await load();
  }

  async function removeAssignment(id) {
    const res = await fetch(apiPaths.assignment(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function removeStudyBlock(id) {
    const res = await fetch(apiPaths.studyBlock(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function completeAssignment(id) {
    setError(null);
    const res = await fetch(apiPaths.assignment(id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
    const rankUp = await checkRankUp();
    if (rankUp) setRankUpRank(rankUp);
  }

  async function completeStudyBlock(id) {
    setError(null);
    const res = await fetch(apiPaths.studyBlock(id), {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_complete: true,
        completed_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
    const rankUp = await checkRankUp();
    if (rankUp) setRankUpRank(rankUp);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Plan the week and add assignments directly to the calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart((ws) => addDays(ws, -7))}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart(startOfWeekMonday(new Date()))}
          >
            This week
          </button>
          <button
            type="button"
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            onClick={() => setWeekStart((ws) => addDays(ws, 7))}
          >
            Next
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-7">
        {days.map((day, i) => {
          const key = day.toDateString();
          const items = byDay[key] ?? [];
          return (
            <div
              key={key}
              className="flex min-h-[180px] flex-col rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="text-xs font-semibold uppercase text-zinc-500">{WEEKDAYS[i]}</div>
              <div className="text-sm font-medium">{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
              <ul className="mt-2 flex flex-1 flex-col gap-2 text-xs">
                {items.map((entry) => {
                  const isStudy = entry.itemType === "study";
                  const timeValue = isStudy ? new Date(entry.starts_at) : new Date(entry.due_at);
                  const color = isStudy ? "#8b5cf6" : entry.courses?.color ?? "#3B82F6";

                  return (
                    <li
                      key={`${entry.itemType}-${entry.id}`}
                      className={`rounded-md border p-2 dark:border-zinc-800 ${
                        entry.is_complete || entry.status === "done"
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900"
                          : "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-100"
                      }`}
                    >
                      <div className="font-medium leading-snug">{entry.title}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                        {isStudy ? "Study block" : "Assignment"}
                        {entry.is_complete || entry.status === "done" ? (
                          <span className="ml-1 rounded bg-emerald-200 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">Done</span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-500">
                        {timeValue.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {entry.is_complete || entry.status === "done" ? null : (
                          <button
                            type="button"
                            className="text-[10px] font-medium text-emerald-600 hover:underline"
                            onClick={() => {
                              if (isStudy) {
                                void completeStudyBlock(entry.id);
                              } else {
                                void completeAssignment(entry.id);
                              }
                            }}
                          >
                            Complete
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-[10px] font-medium text-red-600 hover:underline"
                          onClick={() => {
                            if (isStudy) {
                              void removeStudyBlock(entry.id);
                            } else {
                              void removeAssignment(entry.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <form onSubmit={addAssignment} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">Add assignment</div>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium">Assignment</span>
            <input
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Essay draft"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Course</span>
            <input
              value={assignmentCourseName}
              onChange={(e) => setAssignmentCourseName(e.target.value)}
              placeholder="Type a course name"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Due</span>
            <input
              type="datetime-local"
              value={assignmentDueLocal}
              onChange={(e) => setAssignmentDueLocal(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </label>
        </div>
        <label className="mt-3 flex flex-col gap-1 text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            value={assignmentNotes}
            onChange={(e) => setAssignmentNotes(e.target.value)}
            className="min-h-[72px] rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Optional details"
          />
        </label>
        <div className="mt-3 flex justify-end">
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Add assignment
          </button>
        </div>
      </form>

      {rankUpRank ? <RankUpPopup rank={rankUpRank} onDismiss={() => setRankUpRank(null)} /> : null}
    </div>
  );
}
