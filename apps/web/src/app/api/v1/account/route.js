import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";
import { createAdminClient } from "@/lib/supabase/admin";

/** Permanently delete the signed-in user and all planner data (cascade). */
export async function DELETE(request) {
  const { user } = await requireUser(request);
  if (!user) return jsonError("Unauthorized", 401);

  const admin = createAdminClient();
  if (!admin) {
    return jsonError(
      "Account deletion is not configured. Contact the site owner.",
      503,
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return jsonError(error.message, 500);

  return new NextResponse(null, { status: 204 });
}
