/**
 * Purpose: Shared date helpers for web + extension (due soon, week bounds).
 * Used by: dashboard summary, extension badge, notifications.
 */

/** Monday 00:00 through Sunday 23:59:59 in local time, as ISO strings. */
export function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: sunday.toISOString() };
}

/** Parse YYYY-MM-DD as a local calendar date (avoids UTC midnight shifting the day). */
export function parseLocalDateString(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** YYYY-MM-DD for a Date in the user's local timezone. */
export function toLocalDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whether an ISO timestamp falls on the given local YYYY-MM-DD day. */
export function isSameLocalDate(isoOrDate, dateStr) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return false;
  return toLocalDateInputValue(d) === dateStr;
}

/** Start/end of calendar day in local time. */
export function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

const DUE_SOON_HOURS = 48;

export function getDueLabel(dueAt, now = Date.now()) {
  const due = new Date(dueAt).getTime();
  const hours = (due - now) / (1000 * 60 * 60);
  if (hours < 0) return "overdue";
  if (hours <= DUE_SOON_HOURS) return "dueSoon";
  return null;
}

export function isDueSoon(dueAt, now = Date.now()) {
  return getDueLabel(dueAt, now) === "dueSoon";
}

/** Past due and still active — ignores ancient Canvas history (>90 days past due). */
export function isAssignmentOverdue(assignment, now = Date.now()) {
  if (!assignment?.due_at || assignment.status === "done") return false;
  const due = new Date(assignment.due_at).getTime();
  if (Number.isNaN(due)) return false;
  const ms = now - due;
  if (ms < 0) return false;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  if (ms > ninetyDays) return false;
  return true;
}

export function isDueToday(dueAt, now = new Date()) {
  const due = new Date(dueAt);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}
