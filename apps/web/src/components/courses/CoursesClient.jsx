"use client";

import { apiPaths } from "@k12/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useUndoStack } from "@/hooks/useUndoStack";
import { NeedsRedoPanel } from "@/components/dashboard/NeedsRedoPanel";
import { CanvasSyncHint } from "./CanvasSyncHint";
import { CourseCard } from "./CourseCard";
import { CourseFilterBar } from "./CourseFilterBar";
import { FilteredWorkList } from "./FilteredWorkList";

function flattenBucket(courses, bucket) {
  return courses
    .flatMap((c) => c[bucket] ?? [])
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
}

function matchesSearch(text, q) {
  return text?.toLowerCase().includes(q);
}

export function CoursesClient({
  data,
  canvasConnected = false,
  lastSyncedAt = null,
  initialFilter = "all",
}) {
  const router = useRouter();
  const { pushUndo } = useUndoStack(() => router.refresh());
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState("");
  const gpa = data.gpa ?? {};
  const courses = useMemo(() => data.courses ?? [], [data.courses]);

  const buckets = useMemo(
    () => ({
      overdue: flattenBucket(courses, "overdue"),
      due_today: flattenBucket(courses, "due_today"),
      soon: flattenBucket(courses, "soon"),
      needs_redo: flattenBucket(courses, "needs_redo"),
    }),
    [courses],
  );

  const filters = [
    { id: "all", label: "All classes", count: courses.length },
    { id: "overdue", label: "Overdue", count: buckets.overdue.length },
    { id: "due_today", label: "Today", count: buckets.due_today.length },
    { id: "soon", label: "Soon", count: buckets.soon.length },
    { id: "needs_redo", label: "Redos", count: buckets.needs_redo.length },
  ];

  const q = search.trim().toLowerCase();

  const visibleCourses = useMemo(() => {
    if (!q) return courses;
    return courses.filter(
      (c) =>
        matchesSearch(c.name, q) ||
        [...(c.overdue ?? []), ...(c.due_today ?? []), ...(c.soon ?? []), ...(c.needs_redo ?? [])].some(
          (a) => matchesSearch(a.title, q),
        ),
    );
  }, [courses, q]);

  const visibleBucketItems = useMemo(() => {
    if (filter === "all") return [];
    const items = buckets[filter] ?? [];
    if (!q) return items;
    return items.filter(
      (a) => matchesSearch(a.title, q) || matchesSearch(a.courses?.name, q),
    );
  }, [buckets, filter, q]);

  async function addCourse(e) {
    e.preventDefault();
    setError(null);
    const res = await fetch(apiPaths.courses, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    const created = await res.json().catch(() => null);
    if (created?.id) {
      pushUndo?.({
        label: "add class",
        run: async () => {
          await fetch(apiPaths.course(created.id), { method: "DELETE", credentials: "include" });
        },
      });
    }
    setName("");
    router.refresh();
  }

  const emptyByFilter = {
    overdue: "Nothing overdue — you're caught up.",
    due_today: "Nothing due today.",
    soon: "Nothing due in the next 48 hours.",
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-medium uppercase text-zinc-500">Unweighted GPA</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {gpa.unweighted != null ? gpa.unweighted.toFixed(2) : "—"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">From class % and credit hours</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="text-xs font-medium uppercase text-violet-700 dark:text-violet-300">Weighted GPA</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-violet-900 dark:text-violet-100">
            {gpa.weighted != null ? gpa.weighted.toFixed(2) : "—"}
          </p>
          <p className="mt-1 text-xs text-violet-700/80 dark:text-violet-300/80">
            Honors/AP classes (+1.0 bump) per class setting
          </p>
        </div>
      </div>

      <CanvasSyncHint connected={canvasConnected} lastSyncedAt={lastSyncedAt} />

      <CourseFilterBar
        filters={filters}
        active={filter}
        onChange={setFilter}
        search={search}
        onSearchChange={setSearch}
      />

      {filter === "needs_redo" ? (
        <NeedsRedoPanel
          items={visibleBucketItems}
          onRefresh={() => router.refresh()}
          pushUndo={pushUndo}
        />
      ) : filter !== "all" ? (
        <FilteredWorkList
          items={visibleBucketItems}
          emptyText={q ? "No matches for your search." : emptyByFilter[filter]}
          pushUndo={pushUndo}
        />
      ) : (
        <>
          <form
            onSubmit={addCourse}
            className="flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700"
          >
            <input
              className="min-w-[140px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="New class name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="color"
              className="h-10 w-12 cursor-pointer rounded border border-zinc-300 dark:border-zinc-700"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label="Class color"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add class
            </button>
            {error ? <p className="w-full text-sm text-red-600">{error}</p> : null}
          </form>

          {visibleCourses.length ? (
            <div className="flex flex-col gap-4">
              {visibleCourses.map((c) => (
                <CourseCard key={c.id} course={c} pushUndo={pushUndo} />
              ))}
            </div>
          ) : q ? (
            <p className="text-sm text-zinc-500">No classes or assignments match your search.</p>
          ) : (
            <p className="text-sm text-zinc-500">Add a class to track grades, due work, and redos.</p>
          )}
        </>
      )}
    </div>
  );
}
