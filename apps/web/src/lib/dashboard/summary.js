/**
 * Purpose: Compute dashboard stats from assignments and study blocks.
 * Used by: GET /api/v1/dashboard/summary
 */

import { getWeekBounds, isDueToday, isDueSoon, isOverdue, sumStudyHours } from "@k12/shared";

export function computeDashboardSummary(assignments, studyBlocks, now = new Date()) {
  const { from, to } = getWeekBounds(now);
  const weekStart = new Date(from).getTime();
  const weekEnd = new Date(to).getTime();

  const weekAssignments = assignments.filter((a) => {
    const t = new Date(a.due_at).getTime();
    return t >= weekStart && t <= weekEnd;
  });

  const active = assignments.filter((a) => a.status !== "done");
  const overdue = active.filter((a) => isOverdue(a.due_at, now.getTime()));
  const dueToday = active.filter((a) => isDueToday(a.due_at, now));
  const dueSoon = active.filter(
    (a) => !isDueToday(a.due_at, now) && isDueSoon(a.due_at, now.getTime()),
  );
  const doneThisWeek = weekAssignments.filter((a) => a.status === "done");

  const weekTotal = weekAssignments.length;
  const weekDone = doneThisWeek.length;
  const progressPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  const upcoming = [...active]
    .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.title,
      due_at: a.due_at,
      status: a.status,
      course_id: a.course_id,
      courses: a.courses,
    }));

  const studyInWeek = studyBlocks.filter((b) => {
    const t = new Date(b.starts_at).getTime();
    return t >= weekStart && t <= weekEnd;
  });

  return {
    overdue_count: overdue.length,
    due_today_count: dueToday.length,
    due_soon_count: dueSoon.length,
    done_this_week_count: weekDone.length,
    week_assignment_total: weekTotal,
    progress_percent: progressPercent,
    study_hours_this_week: sumStudyHours(studyInWeek),
    upcoming_deadlines: upcoming,
    week_from: from,
    week_to: to,
    total_assignment_count: assignments.length,
  };
}
