import { isDueSoon, isDueToday, isOverdue } from "@k12/shared";

function priorityScore(assignment, now) {
  const due = assignment.due_at;
  if (isOverdue(due, now)) return 0;
  if (isDueToday(due, new Date(now))) return 1;
  if (isDueSoon(due, now)) return 2;
  if (assignment.status === "in_progress") return 3;
  return 4;
}

/** Rank active assignments for "work on now" (overdue → today → soon → in progress). */
export function computeWorkNow(assignments, now = Date.now(), limit = 5) {
  const active = assignments.filter((a) => a.status !== "done");

  return active
    .sort((a, b) => {
      const pa = priorityScore(a, now);
      const pb = priorityScore(b, now);
      if (pa !== pb) return pa - pb;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    })
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      title: a.title,
      due_at: a.due_at,
      status: a.status,
      course_id: a.course_id,
      courses: a.courses,
      priority: priorityScore(a, now),
    }));
}
