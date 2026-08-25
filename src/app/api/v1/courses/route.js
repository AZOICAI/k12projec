import { courseCreateSchema } from "@k12/shared";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { data, error } = await supabase
    .from("courses")
    .select("*, course_meetings(*)")
    .order("name");

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = courseCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message);
  }

  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: user.id,
      term_id: parsed.data.term_id ?? null,
      name: parsed.data.name,
      color: parsed.data.color,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
