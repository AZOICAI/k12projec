import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { jsonError } from "@/lib/api/http";
import { canvasAuthUrl, isCanvasOAuthConfigured, normalizeCanvasDomain } from "@/lib/canvas/config";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { user } = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  if (!isCanvasOAuthConfigured()) {
    return jsonError("Canvas OAuth is not configured. Use a personal access token instead.", 503);
  }

  const domain = normalizeCanvasDomain(
    new URL(request.url).searchParams.get("domain") ?? "",
  );
  if (!domain) {
    return jsonError("Missing Canvas domain (e.g. yourschool.instructure.com)", 400);
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("canvas_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  cookieStore.set("canvas_oauth_domain", domain, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(canvasAuthUrl(domain, state));
}
