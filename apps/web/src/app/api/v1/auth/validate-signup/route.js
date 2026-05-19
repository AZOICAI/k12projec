import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import {
  getAllowedEmailDomains,
  isEmailAllowedForSignup,
  isInviteCodeValid,
} from "@/lib/auth/signup-policy";

/** Pre-check email domain and invite code before Supabase signUp (no auth required). */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const inviteCode = typeof body.inviteCode === "string" ? body.inviteCode : "";

  if (!email) return jsonError("Email is required", 400);

  if (!isEmailAllowedForSignup(email)) {
    const domains = getAllowedEmailDomains();
    const hint = domains.length ? domains.join(", ") : null;
    return jsonError(
      hint
        ? `Sign-up is limited to school email addresses (@${hint}).`
        : "This email address is not allowed to sign up.",
      403,
    );
  }

  if (!isInviteCodeValid(inviteCode)) {
    return jsonError("Invalid invite code.", 403);
  }

  return NextResponse.json({ ok: true });
}
