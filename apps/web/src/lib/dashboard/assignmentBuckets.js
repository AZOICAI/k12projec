import { isAssignmentOverdue, isDueSoon, isDueToday } from "@k12/shared";
import { isArchivedAssignment } from "@/lib/assignments/stale";
import { mapAssignmentForDashboard } from "./assignmentLists";

export function getActiveAssignments(assignments, now = new Date()) {
  const ts = now.getTime();
  return assignments.filter((a) => a.status !== "done" && !isArchivedAssignment(a, ts));
}

export function isSoonDueAssignment(assignment, now = new Date()) {
  const ts = now.getTime();
  if (assignment.status === "done") return false;
  if (isAssignmentOverdue(assignment, ts)) return false;
  if (isDueToday(assignment.due_at, now)) return false;
  return isDueSoon(assignment.due_at, ts);
}

export function bucketActiveAssignments(assignments, now = new Date()) {
  const active = getActiveAssignments(assignments, now);
  const overdue = active.filter((a) => isAssignmentOverdue(a, now.getTime()));
  const dueToday = active.filter((a) => isDueToday(a.due_at, now));
  const soon = active.filter((a) => isSoonDueAssignment(a, now));

  return {
    overdue: overdue.map(mapAssignmentForDashboard),
    due_today: dueToday.map(mapAssignmentForDashboard),
    soon: soon.map(mapAssignmentForDashboard),
    overdue_count: overdue.length,
    due_today_count: dueToday.length,
    soon_due_count: soon.length,
  };
}
