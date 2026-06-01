import {
  isAssignmentOverdue,
  isDueSoon,
  isDueToday,
} from "@k12/shared";

const LIST_LIMIT = 5;

function sortByDue(a, b) {
  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
}

/** Split active assignments into overdue / today / soon for popup display. */
export function buildWorkQueue(assignments, now = new Date()) {
  const ts = now.getTime();
  const active = (assignments ?? []).filter((a) => a.status !== "done" && a.due_at);

  const overdue = active
    .filter((a) => isAssignmentOverdue(a, ts))
    .sort(sortByDue);

  const dueToday = active
    .filter((a) => !isAssignmentOverdue(a, ts) && isDueToday(a.due_at, now))
    .sort(sortByDue);

  const soon = active
    .filter(
      (a) =>
        !isAssignmentOverdue(a, ts) &&
        !isDueToday(a.due_at, now) &&
        isDueSoon(a.due_at, ts),
    )
    .sort(sortByDue);

  const combined = [
    ...overdue.map((a) => ({ ...a, queueLabel: "Overdue" })),
    ...dueToday.map((a) => ({ ...a, queueLabel: "Today" })),
    ...soon.map((a) => ({ ...a, queueLabel: "Soon" })),
  ];

  return {
    overdue,
    dueToday,
    soon,
    preview: combined.slice(0, LIST_LIMIT),
    totalUrgent: overdue.length + dueToday.length + soon.length,
  };
}
