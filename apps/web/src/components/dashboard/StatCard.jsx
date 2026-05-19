/**
 * Purpose: Single metric on the home dashboard.
 */

import { Card } from "../ui/Card";

export function StatCard({ label, value, hint, accent = "default" }) {
  const accents = {
    default: "text-zinc-900 dark:text-zinc-50",
    danger: "text-red-600 dark:text-red-400",
    warn: "text-amber-600 dark:text-amber-400",
    success: "text-emerald-600 dark:text-emerald-400",
  };

  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${accents[accent] ?? accents.default}`}>
        {value}
      </p>
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </Card>
  );
}
