"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCompletedCourseCredits,
  getCurrentStreak,
  getDatxGraduationProgress,
  getProgressSummary,
  getStudyHours,
  progressTiers,
} from "@/lib/progress";

const STORAGE_KEY = "k12-completed-courses";

function formatHours(hours) {
  return Number.isInteger(hours) ? `${hours}.0h` : `${hours.toFixed(1)}h`;
}

export default function ProgressPage() {
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [courseCredits, setCourseCredits] = useState("1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const lastTierRef = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCompletedCourses(JSON.parse(saved));
      } catch {
        setCompletedCourses([]);
      }
    }

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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedCourses));
  }, [completedCourses]);

  const graduation = useMemo(() => getDatxGraduationProgress(), []);
  const completedCredits = useMemo(() => getCompletedCourseCredits(completedCourses), [completedCourses]);
  const streakDays = useMemo(() => getCurrentStreak(assignments), [assignments]);

  const summary = useMemo(
    () =>
      getProgressSummary({
        assignments,
        studyBlocks,
        streakDays,
        earnedCredits: completedCredits,
      }),
    [assignments, studyBlocks, streakDays, completedCredits],
  );

  useEffect(() => {
    if (!summary.currentTier || summary.currentTier.id === lastTierRef.current) return;

    lastTierRef.current = summary.currentTier.id;
    setToast({ title: `Level up! ${summary.currentTier.name}`, message: `You unlocked ${summary.currentTier.name}. Keep going.` });

    const timeout = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timeout);
  }, [summary.currentTier]);

  function addCompletedCourse(e) {
    e.preventDefault();
    const trimmed = courseName.trim();
    const numeric = Number(courseCredits);
    if (!trimmed || Number.isNaN(numeric) || numeric <= 0) return;

    setCompletedCourses((current) => [
      ...current,
      { id: crypto.randomUUID(), name: trimmed, credits: numeric },
    ]);
    setCourseName("");
    setCourseCredits("1");
  }

  function removeCompletedCourse(id) {
    setCompletedCourses((current) => current.filter((course) => course.id !== id));
  }

  const totalCompleted = completedCredits + summary.earnedCredits;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress & badges</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add completed classes, track your credits, and level up with study hours and assignment streaks.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className={`bg-gradient-to-r ${summary.currentTier.glow} p-6`}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">Current badge</p>
              <h2 className="mt-2 text-3xl font-bold" style={{ color: summary.currentTier.color }}>
                {summary.currentTier.name}
              </h2>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/5 px-5 py-3 text-right backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">Points</p>
              <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">{summary.points}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-200">
              <span>Progress to next level</span>
              <span>
                {summary.nextTier && summary.nextTier.id !== summary.currentTier.id
                  ? `${summary.points} / ${summary.nextTier.minPoints} pts`
                  : "Max level reached"}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-white/40">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${summary.currentTierProgress}%`,
                  background: `linear-gradient(90deg, ${summary.currentTier.color}, #ffffff)`,
                }}
              />
            </div>
            <div className="mt-2 text-right text-xs text-zinc-700 dark:text-zinc-300">
              {summary.nextTier && summary.nextTier.id !== summary.currentTier.id
                ? `${summary.nextTier.minPoints - summary.points} points to ${summary.nextTier.name}`
                : "You’ve unlocked the top tier."}
            </div>
          </div>
        </div>
      </section>

      {toast ? (
        <div className="fixed inset-x-0 top-5 z-50 flex justify-center px-4">
          <div
            className="max-w-md rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 px-5 py-3 text-center shadow-2xl ring-4 ring-yellow-300/40"
            style={{ animation: "pulse 0.9s ease-in-out 3" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-900">Achievement unlocked</p>
            <h3 className="mt-2 text-xl font-bold text-amber-950">{toast.title}</h3>
            <p className="text-sm text-amber-900">{toast.message}</p>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Assignments done", value: summary.completedAssignments },
          { label: "Study hours", value: formatHours(getStudyHours(studyBlocks)) },
          { label: "Daily streak", value: `${streakDays} days` },
          { label: "Completed credits", value: `${completedCredits.toFixed(1)}` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">XP rules</p>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <li>• 1 assignment done = 18 XP</li>
            <li>• 1 study hour = 2 XP</li>
            <li>• 1 day streak = 12 XP</li>
            <li>• 1 credit = 6 XP</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Next milestone</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {summary.nextTier ? `${summary.nextTier.minPoints - summary.points} XP` : "Top tier"}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {summary.nextTier ? `to unlock ${summary.nextTier.name}` : "You’ve reached the final rank."}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Roadmap</p>
          <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Bronze 3</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {summary.points < 300 ? "You’re close to the next bronze milestone." : "You’ve already leveled into a stronger rank."}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-semibold">Completed classes</h3>
          <form onSubmit={addCompletedCourse} className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.6fr_auto]">
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ex: English III"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
            <input
              type="number"
              min="0.5"
              max="10"
              step="0.5"
              value={courseCredits}
              onChange={(e) => setCourseCredits(e.target.value)}
              placeholder="1.0"
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Add class
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {completedCourses.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No completed classes yet. Add a class and its credit value to start leveling up.</p>
            ) : (
              completedCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div>
                    <span className="font-medium">{course.name}</span>
                    <span className="ml-2 text-zinc-600 dark:text-zinc-400">({course.credits} credits)</span>
                  </div>
                  <button type="button" onClick={() => removeCompletedCourse(course.id)} className="text-xs text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-lg font-semibold">School progress</h3>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Completed credits</span>
              <span>{completedCredits.toFixed(1)} credits</span>
            </div>
            <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                style={{ width: `${Math.min(100, (completedCredits / Math.max(1, graduation.totalRequired)) * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
              {Math.max(0, graduation.totalRequired - completedCredits).toFixed(1)} credits left within the DATX plan.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-lg font-semibold">Level ladder</h3>
        <div className="mt-5 space-y-3">
          {progressTiers.map((tier) => {
            const isActive = tier.id === summary.currentTier.id;
            const isPast = summary.points >= tier.minPoints;

            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  isActive
                    ? "border-zinc-400 bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-4 w-4 rounded-full" style={{ backgroundColor: tier.color }} />
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {tier.maxPoints === Infinity ? "2200+ pts" : `${tier.minPoints}–${tier.maxPoints} pts`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-400">
                  {isPast ? "Unlocked" : isActive ? "Current" : "Locked"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-lg font-semibold">DATX graduation requirements</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {graduation.requirements.map((requirement) => {
            const percent = Math.min(100, (requirement.completed / requirement.required) * 100);
            return (
              <div key={requirement.label} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{requirement.label}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    {requirement.completed} / {requirement.required}
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">{requirement.note}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
