/**
 * Purpose: Status chips (overdue, due soon, done).
 */

const styles = {
  overdue: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  dueSoon: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export function Badge({ variant = "default", children, className = "" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[variant] ?? styles.default} ${className}`}
    >
      {children}
    </span>
  );
}
