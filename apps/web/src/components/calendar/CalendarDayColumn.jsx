"use client";

import { useState } from "react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE = 3;

function EventChip({ ev, border }) {
  return (
    <li className={`rounded-md border bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900/60 ${border}`}>
      <div className="truncate font-medium leading-snug">{ev.title}</div>
      <div className="mt-0.5 text-[10px] text-zinc-500">{ev.time}</div>
    </li>
  );
}

export function CalendarDayColumn({ day, isToday, study, assignments }) {
  const [expanded, setExpanded] = useState(false);
  const ordered = [
    ...study.map((ev) => ({ ...ev, border: "border-violet-200 dark:border-violet-900" })),
    ...assignments.map((ev) => ({ ...ev, border: "border-blue-200 dark:border-blue-900" })),
  ];
  const visible = expanded ? ordered : ordered.slice(0, MAX_VISIBLE);
  const hidden = ordered.length - visible.length;

  return (
    <div
      className={`flex min-h-[140px] flex-col rounded-xl border p-2.5 shadow-sm sm:min-h-[160px] sm:p-3 ${
        isToday
          ? "border-blue-400 bg-blue-50/40 ring-1 ring-blue-200 dark:border-blue-700 dark:bg-blue-950/30 dark:ring-blue-900"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      <div className="flex items-baseline justify-between gap-1">
        <div>
          <div className="text-[10px] font-semibold uppercase text-zinc-500 sm:text-xs">
            {WEEKDAYS[day.getDay()]}
          </div>
          <div className="text-sm font-medium">
            {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
        </div>
        {ordered.length > 0 ? (
          <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {ordered.length}
          </span>
        ) : null}
      </div>
      <ul className="mt-2 flex flex-1 flex-col gap-1.5 text-xs">
        {ordered.length === 0 ? <li className="text-zinc-400">—</li> : null}
        {visible.map((ev) => (
          <EventChip key={`${ev.type}-${ev.id}`} ev={ev} border={ev.border} />
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          className="mt-1 text-[10px] font-medium text-blue-600 hover:underline"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : `+${hidden} more`}
        </button>
      ) : null}
    </div>
  );
}
