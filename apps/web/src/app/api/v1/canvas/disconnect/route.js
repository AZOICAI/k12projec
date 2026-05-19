import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { deleteCanvasConnection } from "@/lib/canvas/connection";
import { requireUser } from "@/lib/supabase/api";

export async function DELETE(request) {
  const { user } = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  await deleteCanvasConnection(user.id);
  return new NextResponse(null, { status: 204 });
}
