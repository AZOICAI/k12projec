"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useState } from "react";
import {
  getLocalAccount,
  getLocalDevSessionUsername,
  upsertLocalAccount,
} from "@/lib/dev-auth";

export default function SettingsPage() {
  const [username, setUsername] = useState("");
  const [canvasAccessKey, setCanvasAccessKey] = useState("");
  const [canvasSchoolUrl, setCanvasSchoolUrl] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const currentUsername = getLocalDevSessionUsername();
    if (!currentUsername) {
      setLoading(false);
      setStatus("Sign in to save your Canvas settings.");
      return;
    }

    const account = getLocalAccount(currentUsername);
    setUsername(currentUsername);
    setCanvasAccessKey(account?.canvasAccessKey ?? "");
    setCanvasSchoolUrl(account?.canvasSchoolUrl ?? "");
    setLoading(false);
  }, []);

  async function syncCanvasCourses(schoolUrl, accessKey) {
    const trimmedUrl = schoolUrl.trim().replace(/\/$/, "");
    if (!trimmedUrl || !accessKey.trim()) return [];

    const response = await fetch(`${trimmedUrl}/api/v1/courses?per_page=100`, {
      headers: {
        Authorization: `Bearer ${accessKey.trim()}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Canvas could not be reached with that key and URL.");
    }

    return response.json();
  }

  function findCanvasIdInExisting(course, existingCourses) {
    const name = String(course.name || "").trim().toLowerCase();
    return existingCourses.find((existing) => existing.name.toLowerCase() === name);
  }

  async function syncCanvasAssignments(schoolUrl, accessKey, coursesFromCanvas) {
    const existingAssignments = await fetch(apiPaths.assignments, { credentials: "include" }).then((res) => (res.ok ? res.json() : []));
    const existingCourses = await fetch(apiPaths.courses, { credentials: "include" }).then((res) => (res.ok ? res.json() : []));
    let createdCount = 0;

    for (const canvasCourse of coursesFromCanvas) {
      const courseId = canvasCourse.id;
      const matched = findCanvasIdInExisting(canvasCourse, existingCourses);
      if (!matched) continue;

      const assignmentsRes = await fetch(
        `${schoolUrl.replace(/\/$/, "")}/api/v1/courses/${courseId}/assignments?per_page=100`,
        {
          headers: {
            Authorization: `Bearer ${accessKey.trim()}`,
            Accept: "application/json",
          },
        },
      );

      if (!assignmentsRes.ok) continue;
      const canvasAssignments = await assignmentsRes.json();

      for (const ca of canvasAssignments) {
        const title = String(ca.name || "").trim();
        if (!title) continue;

        const isDuplicate = existingAssignments.some(
          (ea) => ea.title.toLowerCase() === title.toLowerCase() && ea.course_id === matched.id,
        );
        if (isDuplicate) continue;

        const dueAt = ca.due_at ? new Date(ca.due_at).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const res = await fetch(apiPaths.assignments, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: matched.id,
            title,
            due_at: dueAt,
            notes: ca.description || null,
          }),
        });

        if (res.ok) {
          createdCount += 1;
          existingAssignments.push({ title: title.toLowerCase(), course_id: matched.id });
        }
      }
    }

    return createdCount;
  }

  function getWeekStart(date = new Date()) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  async function autoPopulateSchedule() {
    const courses = await fetch(apiPaths.courses, { credentials: "include" }).then((res) => (res.ok ? res.json() : []));
    const existingBlocks = await fetch(apiPaths.studyBlocks, { credentials: "include" }).then((res) => (res.ok ? res.json() : []));
    const weekStart = getWeekStart();
    let createdCount = 0;

    for (const course of courses) {
      const meetings = course.course_meetings || [];
      for (const meeting of meetings) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + meeting.weekday);

        const startsAt = new Date(dayDate);
        startsAt.setHours(Math.floor(meeting.start_minutes / 60), meeting.start_minutes % 60, 0, 0);

        const endsAt = new Date(dayDate);
        endsAt.setHours(Math.floor(meeting.end_minutes / 60), meeting.end_minutes % 60, 0, 0);

        if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) continue;

        const title = `${course.name} class`;

        const isDuplicate = existingBlocks.some(
          (block) =>
            block.title === title &&
            block.course_id === course.id &&
            Math.abs(new Date(block.starts_at).getTime() - startsAt.getTime()) < 60000 &&
            Math.abs(new Date(block.ends_at).getTime() - endsAt.getTime()) < 60000,
        );

        if (isDuplicate) continue;

        const res = await fetch(apiPaths.studyBlocks, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            course_id: course.id,
          }),
        });

        if (res.ok) {
          createdCount += 1;
          existingBlocks.push({ title, course_id: course.id, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() });
        }
      }
    }

    return createdCount;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const currentUsername = getLocalDevSessionUsername();

    if (!currentUsername) {
      setStatus("You need to sign in before saving settings.");
      return;
    }

    const trimmedKey = canvasAccessKey.trim();
    const trimmedSchoolUrl = canvasSchoolUrl.trim();

    upsertLocalAccount(currentUsername, {
      canvasAccessKey: trimmedKey,
      canvasSchoolUrl: trimmedSchoolUrl,
    });

    setSyncing(true);
    setStatus("Syncing Canvas courses, assignments, and schedule...");

    try {
      const coursesFromCanvas = await syncCanvasCourses(trimmedSchoolUrl, trimmedKey);

      const existingCourses = await fetch(apiPaths.courses, { credentials: "include" }).then((res) => (res.ok ? res.json() : []));
      let courseCount = 0;

      for (const course of coursesFromCanvas) {
        const name = String(course.name || "Untitled course").trim();
        if (!name) continue;
        const isDuplicate = existingCourses.some((existing) => existing.name.toLowerCase() === name.toLowerCase());
        if (isDuplicate) continue;

        await fetch(apiPaths.courses, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color: "#60a5fa" }),
        });
        courseCount += 1;
      }

      const assignmentCount = await syncCanvasAssignments(trimmedSchoolUrl, trimmedKey, coursesFromCanvas);

      const blockCount = await autoPopulateSchedule();

      const parts = [];
      parts.push("Canvas settings saved locally.");
      if (courseCount > 0) parts.push(`${courseCount} course(s) added.`);
      if (assignmentCount > 0) parts.push(`${assignmentCount} assignment(s) synced.`);
      if (blockCount > 0) parts.push(`${blockCount} study block(s) created from course meetings.`);
      if (courseCount === 0 && assignmentCount === 0 && blockCount === 0) {
        parts.push("No new data found to sync.");
      }
      setStatus(parts.join(" "));
    } catch (saveError) {
      setStatus(saveError instanceof Error ? saveError.message : "The Canvas sync could not be completed.");
    } finally {
      setSyncing(false);
    }
  }

  function clearCanvasSettings() {
    const currentUsername = getLocalDevSessionUsername();
    if (!currentUsername) {
      setStatus("Sign in to clear saved Canvas settings.");
      return;
    }

    upsertLocalAccount(currentUsername, {
      canvasAccessKey: "",
      canvasSchoolUrl: "",
    });
    setCanvasAccessKey("");
    setCanvasSchoolUrl("");
    setStatus("Saved Canvas settings cleared.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">School & Canvas sync</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Save your Canvas access key and school URL here so your planner can connect to your K12 course data.
          Courses and assignments will sync automatically, and study blocks will be created from your course meeting schedule.
        </p>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
        <h2 className="text-sm font-semibold text-blue-800 dark:text-blue-200">How to get your Canvas API key</h2>
        <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
          <li>Log into your K12 Canvas account</li>
          <li>Go to <strong>Account</strong> (top-left sidebar)</li>
          <li>Click <strong>Settings</strong></li>
          <li>Scroll down to <strong>Approved Integrations</strong> and click <strong>+ New Access Token</strong></li>
          <li>Give it a name (e.g. "K12 Planner") and click <strong>Generate Token</strong></li>
          <li>Copy the token and paste it below — it will only show once!</li>
        </ol>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          <strong>Automation notice:</strong> This auto-sync feature is still being worked on and may be buggy. It is meant to save you from having to upload assignments manually, but double-check that everything synced correctly.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as <span className="font-semibold text-zinc-900 dark:text-zinc-100">{username || "Unknown user"}</span>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium">
            <span className="mb-1 block">Canvas school URL</span>
            <input
              value={canvasSchoolUrl}
              onChange={(e) => setCanvasSchoolUrl(e.target.value)}
              placeholder="https://school.instructure.com"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <label className="block text-sm font-medium">
            <span className="mb-1 block">Canvas access key</span>
            <input
              value={canvasAccessKey}
              onChange={(e) => setCanvasAccessKey(e.target.value)}
              type="password"
              placeholder="Paste your Canvas token here"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading || syncing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {syncing ? "Syncing..." : "Save & sync"}
            </button>
            <button
              type="button"
              onClick={clearCanvasSettings}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Clear saved key
            </button>
          </div>
        </form>

        {status ? <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{status}</p> : null}

        <div className="mt-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <p>This stores the token in your browser local storage so your saved account remembers it on future sign-ins.</p>
          <p className="font-medium">What gets synced:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Canvas courses are added to your course list</li>
            <li>Canvas assignments with due dates are synced to your assignment list</li>
            <li>Study blocks are auto-created from course meeting times (set up in Courses page)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}