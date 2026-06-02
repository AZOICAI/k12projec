import { tutorChatSchema } from "@k12/shared";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { simulateTutorResponse } from "@/lib/tutor/chat";
import { requireUser } from "@/lib/supabase/api";

function buildAssignmentText(row) {
  const parts = [];
  if (row?.title) parts.push(row.title);
  if (row?.notes?.trim()) parts.push(row.notes.trim());
  if (row?.courses?.name) parts.push(`Course: ${row.courses.name}`);
  return parts.join("\n\n");
}

export async function POST(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = tutorChatSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message);
  }

  let assignmentText = parsed.data.assignment_text.trim();

  if (parsed.data.assignment_id) {
    const { data: row, error } = await supabase
      .from("assignments")
      .select("id, title, notes, courses(name)")
      .eq("id", parsed.data.assignment_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!row) return jsonError("Assignment not found", 404);

    assignmentText = buildAssignmentText(row) || assignmentText;
  }

  const reply = simulateTutorResponse(assignmentText, parsed.data.chat_message);

  return NextResponse.json({
    reply,
    assignment_text: assignmentText,
  });
}
