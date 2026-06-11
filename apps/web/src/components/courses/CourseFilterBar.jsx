"use client";

const TONES = {
  all: "data-[active=true]:bg-blue-600 data-[active=true]:text-white",
  overdue: "data-[active=true]:bg-red-600 data-[active=true]:text-white",
  due_today: "data-[active=true]:bg-amber-500 data-[active=true]:text-white",
  soon: "data-[active=true]:bg-blue-500 data-[active=true]:text-white",
  needs_redo: "data-[active=true]:bg-violet-600 data-[active=true]:text-white",
};

export function CourseFilterBar({ filters, active, onChange, search, onSearchChange }) {
  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        placeholder="Search by title or class…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search assignments"
      />
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter assignments">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={active === f.id}
            data-active={active === f.id}
            className={`rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 data-[active=true]:border-transparent dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 ${TONES[f.id] ?? TONES.all}`}
            onClick={() => onChange(f.id)}
          >
            {f.label}
            {f.count > 0 ? <span className="ml-1.5 tabular-nums opacity-80">{f.count}</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
