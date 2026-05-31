import { getDayBounds, getWeekBounds, isAssignmentOverdue, isDueToday } from "@k12/shared";
import { shouldReconcileGradedAsDone } from "@/lib/canvas/assignmentImport";

/** Monday 00:00 local — assignments due before this are last week / last term. */
export function getStaleDueCutoff(date = new Date()) {
  return getWeekBounds(date).from;
}

export function isStaleAssignment(assignment, date = new Date()) {
  if (assignment.status === "done") return false;
  if (!assignment.due_at) return false;
  const due = new Date(assignment.due_at).getTime();
  if (Number.isNaN(due)) return false;
  return due < new Date(getStaleDueCutoff(date)).getTime();
}

/** Hide from active views: stale, past-due (not today), or ancient (>90d past due). */
export function isArchivedAssignment(assignment, now = Date.now()) {
  if (assignment.status === "done") return false;
  if (isStaleAssignment(assignment, new Date(now))) return true;
  if (!assignment.due_at) return false;
  const due = new Date(assignment.due_at).getTime();
  if (Number.isNaN(due)) return false;
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;
  if (now - due > ninetyDays) return true;
  const n = new Date(now);
  if (isAssignmentOverdue(assignment, now) && !isDueToday(assignment.due_at, n)) return true;
  return false;
}

/** Fix rows that have Canvas grades but were left as todo (overdue / redo lists wrong). */
export async function reconcileGradedAssignments(supabase, userId, assignments) {
  const ids = assignments.filter(shouldReconcileGradedAsDone).map((a) => a.id);
  if (!ids.length) return assignments;

  const { error } = await supabase
    .from("assignments")
    .update({ status: "done", is_low_grade: false })
    .in("id", ids)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const idSet = new Set(ids);
  return assignments.map((a) => (idSet.has(a.id) ? { ...a, status: "done" } : a));
}

/** Mark old open assignments done so summer / break views stay empty. */
export async function dismissStaleAssignments(supabase, userId) {
  const { from: todayStart } = getDayBounds();
  const weekStart = getStaleDueCutoff();
  const cutoffs = [weekStart, todayStart].sort();

  for (const cutoff of [...new Set(cutoffs)]) {
    const { error } = await supabase
      .from("assignments")
      .update({ status: "done" })
      .eq("user_id", userId)
      .lt("due_at", cutoff)
      .in("status", ["todo", "in_progress"]);
    if (error) throw new Error(error.message);
  }
}
