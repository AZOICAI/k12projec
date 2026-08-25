import { courseMeetingSchema } from "@k12/shared";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request, context) {
  const { id: courseId } = await context.params;
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { data: course, error: cErr } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (cErr || !course) return jsonError("Not found", 404);

  const { data, error } = await supabase
    .from("course_meetings")
    .select("*")
    .eq("course_id", courseId)
    .order("weekday");

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request, context) {
  const { id: courseId } = await context.params;
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { data: course, error: cErr } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (cErr || !course) return jsonError("Not found", 404);

  const body = await request.json().catch(() => null);
  const parsed = courseMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message);
  }

  const { data, error } = await supabase
    .from("course_meetings")
    .insert({
      course_id: courseId,
      weekday: parsed.data.weekday,
      start_minutes: parsed.data.start_minutes,
      end_minutes: parsed.data.end_minutes,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
