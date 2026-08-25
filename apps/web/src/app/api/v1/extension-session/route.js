import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

/** Verify session (cookie or Bearer). Used by the browser extension after sign-in. */
export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  return NextResponse.json({
    user: { id: user.id, email: user.email },
  });
}
