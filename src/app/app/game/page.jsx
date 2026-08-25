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

const missions = [
  { label: "Finish 3 assignments", target: 3, icon: "✓", accent: "from-emerald-500 to-cyan-400" },
  { label: "Study 2.5 hours", target: 2.5, icon: "⏱", accent: "from-violet-500 to-indigo-500" },
  { label: "Add 2 completed classes", target: 2, icon: "★", accent: "from-amber-500 to-orange-500" },
];

const dailyChallenges = [
  { text: "Complete one assignment before 8 PM", done: false },
  { text: "Log 45 minutes of focused study", done: false },
  { text: "Mark a redo as finished", done: true },
];

function formatHours(hours) {
  return Number.isInteger(hours) ? `${hours}.0h` : `${hours.toFixed(1)}h`;
}

function getMissionProgress(summary, completedCredits, studyHours) {
  return [
    {
      ...missions[0],
      current: summary.completedAssignments,
      reward: "18 XP",
    },
    {
      ...missions[1],
      current: studyHours,
      reward: "30 XP",
    },
    {
      ...missions[2],
      current: completedCredits,
      reward: "36 XP",
    },
  ];
}

export default function GamePage() {
  const [assignments, setAssignments] = useState([]);
  const [studyBlocks, setStudyBlocks] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [courseCredits, setCourseCredits] = useState("1");
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
          throw new Error("Failed to load game data.");
        }

        setAssignments(await aRes.json());
        setStudyBlocks(await sRes.json());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load game data.");
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
  const studyHours = useMemo(() => getStudyHours(studyBlocks), [studyBlocks]);

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

  const missionCards = useMemo(
    () => getMissionProgress(summary, completedCredits, studyHours),
    [summary, completedCredits, studyHours],
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Game hub</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Finish assignments, study, and complete classes to earn your next badge.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-950 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_30px_80px_rgba(15,23,42,0.6)]">
        <div className={`bg-gradient-to-br ${summary.currentTier.glow} p-6 md:p-8`}>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="relative flex h-52 w-52 items-center justify-center rounded-full border-[10px] border-white/25 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.7),rgba(255,255,255,0.12)_30%,rgba(0,0,0,0.3)_70%)] shadow-[0_0_40px_rgba(255,255,255,0.14)]">
                <div className="absolute inset-4 rounded-full border border-white/30" />
                <div className="absolute inset-8 rounded-full border border-white/20" />
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-950/80 text-4xl font-black text-white shadow-inner shadow-white/10">
                  {summary.currentTier.name.charAt(0)}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-700 dark:text-zinc-200">Current rank</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight" style={{ color: summary.currentTier.color }}>
                {summary.currentTier.name}
              </h2>

              <div className="mt-6 flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 dark:text-zinc-300">XP</p>
                  <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-zinc-50">{summary.points}</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/5 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 backdrop-blur-sm">
                  {summary.nextTier && summary.nextTier.id !== summary.currentTier.id
                    ? `${summary.nextTier.minPoints - summary.points} XP to ${summary.nextTier.name}`
                    : "Top tier unlocked"}
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-200">
                  <span>Progress to next badge</span>
                  <span>{Math.min(100, Math.round(summary.currentTierProgress))}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-white/35">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${summary.currentTierProgress}%`,
                      background: `linear-gradient(90deg, ${summary.currentTier.color}, #ffffff)`,
                    }}
                  />
                </div>
              </div>
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
          { label: "Study hours", value: formatHours(studyHours) },
          { label: "Daily streak", value: `${streakDays} days` },
          { label: "Credits", value: `${completedCredits.toFixed(1)}` },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-lg font-semibold">Mission cards</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {missionCards.map((mission) => {
                const percent = Math.min(100, ((mission.current || 0) / mission.target) * 100);
                return (
                  <div key={mission.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${mission.accent} text-lg font-bold text-white`}>
                      {mission.icon}
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">{mission.label}</p>
                    <p className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
                      {mission.current} / {mission.target}
                    </p>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div className={`h-full rounded-full bg-gradient-to-r ${mission.accent}`} style={{ width: `${percent}%` }} />
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Reward: {mission.reward}</p>
                  </div>
                );
              })}
            </div>
          </div>

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
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No completed classes yet. Add a class and credit value to start gaining XP.</p>
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
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-lg font-semibold">Daily challenge</h3>
            <ul className="mt-4 space-y-3">
              {dailyChallenges.map((challenge) => (
                <li key={challenge.text} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${challenge.done ? "bg-emerald-500 text-white" : "bg-zinc-300 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"}`}>
                    {challenge.done ? "✓" : "•"}
                  </span>
                  <span className={challenge.done ? "text-zinc-400 line-through" : "text-zinc-700 dark:text-zinc-200"}>{challenge.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-lg font-semibold">School progress</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-baseline justify-between text-sm text-zinc-600 dark:text-zinc-400">
                <span>Completed credits</span>
                <span>{completedCredits.toFixed(1)} credits</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                  style={{ width: `${Math.min(100, (completedCredits / Math.max(1, graduation.totalRequired)) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {Math.max(0, graduation.totalRequired - completedCredits).toFixed(1)} credits left in the DATX plan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="text-lg font-semibold">Rank ladder</h3>
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
                      {tier.maxPoints === Infinity ? "2200+ XP" : `${tier.minPoints}–${tier.maxPoints} XP`}
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
    </div>
  );
}
