import { preferencesUpdateSchema } from "@k12/shared";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { requireUser } from "@/lib/supabase/api";

const defaults = {
  timezone: "America/New_York",
  web_notifications_enabled: false,
  extension_notifications_enabled: false,
  remind_before_hours: [24, 2],
};

async function ensurePreferences(supabase, userId) {
  const { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (data) return data;

  const { data: inserted, error } = await supabase
    .from("user_preferences")
    .insert({ user_id: userId })
    .select("*")
    .single();

  if (error) return { ...defaults, user_id: userId };
  return inserted;
}

export async function GET(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const prefs = await ensurePreferences(supabase, user.id);
  return NextResponse.json(prefs);
}

export async function PATCH(request) {
  const { user, supabase } = await requireUser(request);
  if (!user || !supabase) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = preferencesUpdateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.message);

  await ensurePreferences(supabase, user.id);

  const { data, error } = await supabase
    .from("user_preferences")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json(data);
}
