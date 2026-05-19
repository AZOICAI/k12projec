import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { runEmailReminders } from "@/lib/reminders/run";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", 401);
  }

  try {
    const result = await runEmailReminders();
    return NextResponse.json(result);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Cron failed", 500);
  }
}
