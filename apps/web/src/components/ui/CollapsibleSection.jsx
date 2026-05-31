"use client";

import { useState } from "react";

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  children,
  className = "",
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
          {!open && summary ? (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{summary}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-zinc-400" aria-hidden>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? <div className="border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">{children}</div> : null}
    </section>
  );
}
