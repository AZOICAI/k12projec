import { NextResponse } from "next/server";
import { getSignupPolicyForClient } from "@/lib/auth/signup-policy";

/** Public signup policy hints (no secrets). */
export async function GET() {
  return NextResponse.json({
    ...getSignupPolicyForClient(),
    canvasSyncAvailable: false,
    contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null,
  });
}
