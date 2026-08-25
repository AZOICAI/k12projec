import { termCreateSchema } from "@k12/shared";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { data, error } = await supabase
    .from("terms")
    .select("*")
    .order("starts_on", { ascending: false });

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}

export async function POST(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = termCreateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.flatten().formErrors.join(", "));
  }

  const { data, error } = await supabase
    .from("terms")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      starts_on: parsed.data.starts_on,
      ends_on: parsed.data.ends_on,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data, { status: 201 });
}
