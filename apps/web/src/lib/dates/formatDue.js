/** Human-readable due date for list rows. */
export function formatRelativeDue(dueAt, now = new Date()) {
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return "";

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDue = new Date(due);
  startOfDue.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfDue - startOfToday) / 86400000);

  const time = due.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (dayDiff < 0) return dayDiff === -1 ? `Yesterday ${time}` : `${Math.abs(dayDiff)} days ago`;
  if (dayDiff === 0) return `Today ${time}`;
  if (dayDiff === 1) return `Tomorrow ${time}`;
  if (dayDiff < 7) {
    return `${due.toLocaleDateString(undefined, { weekday: "short" })} ${time}`;
  }
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
