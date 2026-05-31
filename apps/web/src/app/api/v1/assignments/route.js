import { assignmentCreateSchema } from "@k12/shared";
import { NextRequest, NextResponse } from "next/server";
import { insertAssignment } from "@/lib/assignments/insertAssignment";
import { dismissStaleAssignments } from "@/lib/assignments/stale";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  await dismissStaleAssignments(supabase, user.id);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("assignments")
    .select("*, courses(name, color)")
    .eq("user_id", user.id)
    .order("due_at", { ascending: true });

  if (from) query = query.gte("due_at", from);
  if (to) query = query.lte("due_at", to);

  const { data, error } = await query;

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = assignmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message);
  }

  const { data, error } = await insertAssignment(supabase, {
    user_id: user.id,
    course_id: parsed.data.course_id,
    title: parsed.data.title,
    due_at: parsed.data.due_at,
    status: parsed.data.status ?? "todo",
    notes: parsed.data.notes ?? null,
    estimate_minutes: parsed.data.estimate_minutes ?? null,
    source_url: parsed.data.source_url ?? null,
    is_redo: parsed.data.is_redo ?? false,
    is_low_grade: parsed.data.is_low_grade ?? false,
    redo_of_assignment_id: parsed.data.redo_of_assignment_id ?? null,
    redo_dismissed: parsed.data.redo_dismissed ?? false,
    score: parsed.data.score ?? null,
    points_possible: parsed.data.points_possible ?? null,
    grade_percent: parsed.data.grade_percent ?? null,
  });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
