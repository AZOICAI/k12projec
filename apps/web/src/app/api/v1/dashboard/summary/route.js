import { NextResponse } from "next/server";
import { computeDashboardSummary } from "@/lib/dashboard/summary";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";
import { getWeekBounds } from "@k12/shared";

export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { from, to } = getWeekBounds();

  const [assignmentsRes, studyRes, coursesRes] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, due_at, status, course_id, courses(name, color)")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true }),
    supabase
      .from("study_blocks")
      .select("id, starts_at, ends_at")
      .eq("user_id", user.id)
      .gte("starts_at", from)
      .lte("starts_at", to),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  if (assignmentsRes.error) return jsonError(assignmentsRes.error.message, 500);
  if (studyRes.error) return jsonError(studyRes.error.message, 500);
  if (coursesRes.error) return jsonError(coursesRes.error.message, 500);

  const summary = {
    ...computeDashboardSummary(assignmentsRes.data ?? [], studyRes.data ?? []),
    course_count: coursesRes.count ?? 0,
  };

  return NextResponse.json(summary);
}
