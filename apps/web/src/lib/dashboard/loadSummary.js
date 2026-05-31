import { getWeekBounds } from "@k12/shared";
import { fetchUserAssignments } from "@/lib/assignments/fetchUserAssignments";
import { dismissStaleAssignments, reconcileGradedAssignments } from "@/lib/assignments/stale";
import { createClient } from "@/lib/supabase/server";
import { buildCourseDetailCards } from "./courseDetails";
import { computeGpaSummary } from "./gpa";
import { computeDashboardSummary } from "./summary";

const COURSE_SELECT =
  "id, name, color, current_grade_percent, target_grade_percent, credit_hours, is_weighted";

async function sumStudySessionMinutes(supabase, userId, from, to) {
  const { data, error } = await supabase
    .from("study_sessions")
    .select("duration_minutes")
    .eq("user_id", userId)
    .gte("completed_at", from)
    .lte("completed_at", to);

  if (error) {
    if (error.message?.includes("study_sessions") || error.message?.includes("schema cache")) {
      return 0;
    }
    throw new Error(error.message);
  }

  return (data ?? []).reduce((sum, row) => sum + (row.duration_minutes ?? 0), 0);
}

/** Load dashboard summary via Supabase. */
export async function loadDashboardSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  await dismissStaleAssignments(supabase, user.id);

  const { from, to } = getWeekBounds(new Date());

  let assignments = await fetchUserAssignments(supabase, user.id);
  assignments = await reconcileGradedAssignments(supabase, user.id, assignments);

  const studyMinutesWeek = await sumStudySessionMinutes(supabase, user.id, from, to);

  let coursesRes = await supabase
    .from("courses")
    .select(COURSE_SELECT)
    .eq("user_id", user.id)
    .order("name");

  if (coursesRes.error) {
    coursesRes = await supabase
      .from("courses")
      .select("id, name, color, current_grade_percent, target_grade_percent")
      .eq("user_id", user.id)
      .order("name");
    if (coursesRes.error) throw new Error(coursesRes.error.message);
  }

  const courses = (coursesRes.data ?? []).map((c) => ({
    ...c,
    credit_hours: c.credit_hours ?? 1,
    is_weighted: Boolean(c.is_weighted),
  }));
  const courseCards = buildCourseDetailCards(courses, assignments);

  return {
    ...computeDashboardSummary(assignments, courseCards, studyMinutesWeek),
    courses: courseCards,
    gpa: computeGpaSummary(courses),
  };
}

/** Same data shape for Courses tab. */
export async function loadCoursesPage() {
  return loadDashboardSummary();
}
