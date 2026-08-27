"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useState } from "react";
import { getStudyHours, getCurrentStreak } from "@/lib/progress";

function formatHours(hours) {
  return Number.isInteger(hours) ? `${hours}.0h` : `${hours.toFixed(1)}h`;
}

export default function ProgressPage() {
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, sRes] = await Promise.all([
          fetch(apiPaths.assignments, { credentials: "include" }),
          fetch(`${apiPaths.studyBlocks}?${new URLSearchParams({
            from: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
          })}`, { credentials: "include" }),
        ]);

        if (!aRes.ok || !sRes.ok) {
          throw new Error("Failed to load progress data.");
        }

        setAssignments(await aRes.json());
        setStudyBlocks(await sRes.json());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load progress data.");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const completedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.status === "done").length,
    [assignments],
  );
  const streakDays = useMemo(() => getCurrentStreak(assignments), [assignments]);
  const studyHours = useMemo(() => getStudyHours(studyBlocks), [studyBlocks]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Keep it simple: track what is complete, how much you study, and your momentum.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading progress…</p>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Assignments done</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{completedAssignments}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Study hours</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{formatHours(studyHours)}</p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Streak</p>
              <p className="mt-3 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">{streakDays} days</p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold">Quick overview</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Complete assignments, keep study blocks on the calendar, and stay consistent. That is the core of the planner.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
