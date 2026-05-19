import { studyBlockCreateSchema } from "@k12/shared";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("study_blocks")
    .select("*")
    .eq("user_id", user.id)
    .order("starts_at", { ascending: true });

  if (from) query = query.gte("starts_at", from);
  if (to) query = query.lte("ends_at", to);

  const { data, error } = await query;

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = studyBlockCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message);
  }

  const { data, error } = await supabase
    .from("study_blocks")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      course_id: parsed.data.course_id ?? null,
      assignment_id: parsed.data.assignment_id ?? null,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
