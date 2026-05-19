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

export function isOverdue(dueAt, now = Date.now()) {
  return getDueLabel(dueAt, now) === "overdue";
}

export function isDueToday(dueAt, now = new Date()) {
  const due = new Date(dueAt);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  );
}

/** Hours of study blocks overlapping [from, to]. */
export function sumStudyHours(blocks) {
  let ms = 0;
  for (const b of blocks) {
    ms += new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime();
  }
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}
