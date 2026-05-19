import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function DELETE(request, context) {
  const { id: courseId, meetingId } = await context.params;
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { data: course, error: cErr } = await supabase
    .from("courses")
    .select("id")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (cErr || !course) return jsonError("Not found", 404);

  const { error } = await supabase
    .from("course_meetings")
    .delete()
    .eq("id", meetingId)
    .eq("course_id", courseId);

  if (error) return jsonError(error.message, 500);
  return new NextResponse(null, { status: 204 });
}
