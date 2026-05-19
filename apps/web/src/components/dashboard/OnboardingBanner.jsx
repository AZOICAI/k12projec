"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function OnboardingBanner({ courseCount, assignmentCount, canvasAvailable }) {
  if (courseCount > 0 && assignmentCount > 0) return null;

  const steps = [
    {
      done: courseCount > 0,
      title: "Add your courses",
      href: "/app/courses",
      detail: "Name each class and pick a color for the calendar.",
    },
    {
      done: assignmentCount > 0,
      title: "Add your first assignment",
      href: "/app/assignments",
      detail: "Press / on the dashboard for quick add.",
    },
    {
      done: false,
      title: canvasAvailable ? "Import from Canvas" : "Canvas import (when school enables it)",
      href: canvasAvailable ? "/app/settings" : "/help",
      detail: canvasAvailable
        ? "Settings → Connect Canvas → Import now."
        : "Until then, add work manually or use the Classroom extension.",
    },
    {
      done: false,
      title: "Chrome extension (optional)",
      href: "/help",
      detail: "Save assignments from Google Classroom while you browse.",
    },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/40">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Welcome — get started</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        School beta: add courses, then deadlines.{" "}
        <Link href="/help" className="text-blue-600 hover:underline">
          Full guide
        </Link>
      </p>
      <ol className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.title} className="flex gap-3 text-sm">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                step.done
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-300 text-zinc-500 dark:border-zinc-600"
              }`}
              aria-hidden
            >
              {step.done ? "✓" : ""}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{step.title}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{step.detail}</p>
              {!step.done && step.href ? (
                <Link href={step.href} className="mt-1 inline-block text-blue-600 hover:underline">
                  Go →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/app/courses"
          className="inline-flex rounded-[var(--radius-button)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          Add a course
        </Link>
        <Link
          href="/help"
          className="inline-flex rounded-[var(--radius-button)] border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          How to use
        </Link>
      </div>
    </Card>
  );
}
