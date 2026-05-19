import { Card } from "../ui/Card";

export function WeeklyProgress({ percent, done, total }) {
  return (
    <Card>
      <h2 className="text-lg font-medium">This week&apos;s progress</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {done} of {total} assignments completed
      </p>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
      <p className="mt-2 text-right text-sm font-medium tabular-nums">{percent}%</p>
    </Card>
  );
}
