import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { isCanvasSyncAvailable } from "@/lib/canvas/config";
import { syncCanvasForUser } from "@/lib/canvas/sync";
import { requireUser } from "@/lib/supabase/api";

export async function POST(request) {
  const { user } = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  if (!isCanvasSyncAvailable()) {
    return jsonError("Canvas import is not available", 503);
  }

  try {
    const result = await syncCanvasForUser(user.id);
    if (result.error) return jsonError(result.error, 400);
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Sync failed", 500);
  }
}
