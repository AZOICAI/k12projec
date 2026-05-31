/**
 * Purpose: Compute dashboard stats for the Today tab.
 */

import { getWeekBounds, isAssignmentOverdue, isDueToday } from "@k12/shared";
import { isArchivedAssignment } from "@/lib/assignments/stale";
import { bucketActiveAssignments } from "./assignmentBuckets";
import { computeNeedsRedoAssignments, mapAssignmentForDashboard } from "./assignmentLists";

export function computeDashboardSummary(assignments, courses = [], studyMinutesWeek = 0, now = new Date()) {
  const { from, to } = getWeekBounds(now);
  const weekStartMs = new Date(from).getTime();
  const weekEndMs = new Date(to).getTime();
  const ts = now.getTime();

  const buckets = bucketActiveAssignments(assignments, now);
  const needsRedo = computeNeedsRedoAssignments(assignments, courses, now);

  const weekAssignments = assignments.filter((a) => {
    if (isArchivedAssignment(a, ts)) return false;
    const t = new Date(a.due_at).getTime();
    if (Number.isNaN(t)) return false;
    return t >= weekStartMs && t <= weekEndMs;
  });

  const weekActive = weekAssignments.filter((a) => a.status !== "done");
  const doneThisWeek = weekAssignments.filter((a) => a.status === "done");

  const weekTotal = weekAssignments.length;
  const weekDone = doneThisWeek.length;
  const progressPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  const weekList = [...weekActive].sort((a, b) => {
    const rank = (x) => {
      if (isAssignmentOverdue(x, ts) && x.status !== "done") return 0;
      if (isDueToday(x.due_at, now) && x.status !== "done") return 1;
      if (x.is_redo && x.status !== "done") return 2;
      if (x.status === "done") return 4;
      return 3;
    };
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return {
    overdue_count: buckets.overdue_count,
    due_today_count: buckets.due_today_count,
    soon_due_count: buckets.soon_due_count,
    needs_redo_count: needsRedo.length,
    study_minutes_week: studyMinutesWeek,
    done_this_week_count: weekDone.length,
    week_assignment_total: weekTotal,
    progress_percent: progressPercent,
    week_assignments: weekList.map(mapAssignmentForDashboard),
    stat_buckets: buckets,
    week_from: from,
    week_to: to,
  };
}
