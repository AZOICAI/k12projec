import { getWeekBounds } from "@k12/shared";
import { buildWorkQueue } from "./workQueue";
import { fetchAssignmentsWindow, fetchCourses } from "./api";

/** Data for the Canvas injected sidebar. */
export async function fetchCanvasDashboardData() {
  const assignments = await fetchAssignmentsWindow();
  const snapshot = buildWorkQueue(assignments);
  const { from, to } = getWeekBounds();
  const weekStart = new Date(from).getTime();
  const weekEnd = new Date(to).getTime();

  const weekAssignments = assignments.filter((a) => {
    const t = new Date(a.due_at).getTime();
    if (Number.isNaN(t)) return false;
    return t >= weekStart && t <= weekEnd;
  });

  const weekTotal = weekAssignments.length;
  const weekDone = weekAssignments.filter((a) => a.status === "done").length;
  const weekPercent = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  const missingWork = [
    ...snapshot.overdue.map((a) => ({ ...a, urgency: "overdue" })),
    ...snapshot.dueToday.map((a) => ({ ...a, urgency: "today" })),
  ].slice(0, 12);

  const courses = await fetchCourses();

  return {
    missingWork,
    weekPercent,
    weekDone,
    weekTotal,
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      current_grade_percent: c.current_grade_percent,
      target_grade_percent: c.target_grade_percent,
    })),
  };
}
