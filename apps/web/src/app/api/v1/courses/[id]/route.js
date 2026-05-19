import { courseUpdateSchema } from "@k12/shared";
import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

export async function PATCH(request, context) {
  const { id } = await context.params;
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = courseUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message);
  }

  const { data, error } = await supabase
    .from("courses")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  if (!data) return jsonError("Not found", 404);
  return NextResponse.json(data);
}

export async function DELETE(request, context) {
  const { id } = await context.params;
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return jsonError(error.message, 500);
  return new NextResponse(null, { status: 204 });
}
