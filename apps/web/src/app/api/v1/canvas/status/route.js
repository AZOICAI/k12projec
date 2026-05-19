import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import {
  isCanvasOAuthConfigured,
  isCanvasSyncAvailable,
  isPersonalCanvasTokenAllowed,
} from "@/lib/canvas/config";
import { getCanvasConnection } from "@/lib/canvas/connection";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { user } = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  const connection = await getCanvasConnection(user.id);

  return NextResponse.json({
    available: isCanvasSyncAvailable(),
    oauthAvailable: isCanvasOAuthConfigured(),
    personalTokenAvailable: isPersonalCanvasTokenAllowed(),
    connected: Boolean(connection),
    authType: connection?.auth_type ?? null,
    canvasDomain: connection?.canvas_domain ?? null,
    lastSyncedAt: connection?.last_synced_at ?? null,
    tokenExpiresAt: connection?.token_expires_at ?? null,
  });
}
