import { NextResponse } from "next/server";
import { getSignupPolicyForClient } from "@/lib/auth/signup-policy";
import {
  isCanvasOAuthConfigured,
  isCanvasSyncAvailable,
  isPersonalCanvasTokenAllowed,
} from "@/lib/canvas/config";

/** Public signup policy hints (no secrets). */
export async function GET() {
  return NextResponse.json({
    ...getSignupPolicyForClient(),
    canvasSyncAvailable: isCanvasSyncAvailable(),
    canvasOAuthAvailable: isCanvasOAuthConfigured(),
    canvasPersonalTokenAvailable: isPersonalCanvasTokenAllowed(),
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null,
  });
}
