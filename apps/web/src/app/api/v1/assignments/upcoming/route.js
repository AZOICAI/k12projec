import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

/** Assignments due in the next 7 days (for reminders). */
export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from("assignments")
    .select("id, title, due_at, status, course_id, courses(name, color)")
    .eq("user_id", user.id)
    .neq("status", "done")
    .gte("due_at", now.toISOString())
    .lte("due_at", in7d.toISOString())
    .order("due_at", { ascending: true });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data ?? []);
}
