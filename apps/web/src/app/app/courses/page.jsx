"use client";

import { apiPaths } from "@k12/shared";
import { useEffect, useState } from "react";
import { TermsPanel } from "@/components/courses/TermsPanel";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(m) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setError(null);
    const res = await fetch(apiPaths.courses, { credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      setLoading(false);
      return;
    }
    setCourses(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

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
    setName("");
    setColor("#3B82F6");
    await load();
  }

  async function removeCourse(id) {
    setError(null);
    const res = await fetch(apiPaths.course(id), { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function addMeeting(courseId, weekday, start, end) {
    setError(null);
    const res = await fetch(`${apiPaths.course(courseId)}/meetings`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        weekday,
        start_minutes: timeToMinutes(start),
        end_minutes: timeToMinutes(end),
      }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  async function removeMeeting(courseId, meetingId) {
    setError(null);
    const res = await fetch(`${apiPaths.course(courseId)}/meetings/${meetingId}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Add classes and optional weekly meeting times.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={addCourse}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Course name</span>
          <input
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Color</span>
          <input
            type="color"
            className="h-10 w-16 cursor-pointer rounded border border-zinc-300 bg-white dark:border-zinc-700"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add course
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading courses…</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {courses.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <h2 className="text-lg font-medium">{c.name}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => void removeCourse(c.id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  Delete course
                </button>
              </div>

              <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Weekly meetings</h3>
                {c.course_meetings?.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {c.course_meetings.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-2">
                        <span>
                          {WEEKDAYS[m.weekday]} {minutesToTime(m.start_minutes)}–{minutesToTime(m.end_minutes)}
                        </span>
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => void removeMeeting(c.id, m.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">No meetings yet.</p>
                )}
                <MeetingForm onAdd={(wd, start, end) => void addMeeting(c.id, wd, start, end)} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <TermsPanel />
    </div>
  );
}

function MeetingForm({ onAdd }) {
  const [weekday, setWeekday] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(weekday, start, end);
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Day</span>
        <select
          className="rounded-lg border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
        >
          {WEEKDAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Start</span>
        <input
          type="time"
          className="rounded-lg border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          value={start}
          onChange={(e) => setStart(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">End</span>
        <input
          type="time"
          className="rounded-lg border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
        />
      </label>
      <button type="submit" className="rounded-lg bg-zinc-800 px-3 py-1.5 text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white">
        Add meeting
      </button>
    </form>
  );
}
