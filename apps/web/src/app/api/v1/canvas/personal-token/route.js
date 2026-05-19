import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import {
  isPersonalCanvasTokenAllowed,
  normalizeCanvasDomain,
  verifyCanvasAccessToken,
} from "@/lib/canvas/config";
import { savePersonalCanvasConnection } from "@/lib/canvas/connection";
import { requireUser } from "@/lib/supabase/api";
import { createAdminClient } from "@/lib/supabase/admin";

/** Save a user-generated Canvas access token (testing / until school OAuth key exists). */
export async function POST(request) {
  const { user } = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  if (!isPersonalCanvasTokenAllowed()) {
    return jsonError("Personal Canvas tokens are disabled on this server.", 403);
  }

  if (!createAdminClient()) {
    return jsonError("Server is not configured for Canvas storage.", 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const domain = normalizeCanvasDomain(body.canvasDomain ?? body.domain ?? "");
  const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : "";

  if (!domain) return jsonError("Canvas domain is required (e.g. yourschool.instructure.com).", 400);
  if (!accessToken || accessToken.length < 10) {
    return jsonError("Paste your Canvas access token from Approved Integrations → details.", 400);
  }

  let tokenExpiresAt = null;
  if (body.tokenExpiresAt) {
    const d = new Date(body.tokenExpiresAt);
    if (!Number.isNaN(d.getTime())) tokenExpiresAt = d.toISOString();
  }

  try {
    await verifyCanvasAccessToken(domain, accessToken);
    await savePersonalCanvasConnection(user.id, domain, accessToken, tokenExpiresAt);
    return NextResponse.json({ ok: true, canvasDomain: domain, authType: "personal" });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not verify token", 400);
  }
}
