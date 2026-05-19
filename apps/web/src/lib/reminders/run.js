import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderEmail } from "./email";

function hoursUntil(dueAt, now) {
  return (new Date(dueAt).getTime() - now) / (1000 * 60 * 60);
}

function matchesReminderWindow(dueAt, remindHours, now) {
  const h = hoursUntil(dueAt, now);
  for (const target of remindHours) {
    if (h <= target && h > target - 1) return true;
  }
  return false;
}

/** Hourly cron: email users about assignments in their remind_before_hours window. */
export async function runEmailReminders() {
  const admin = createAdminClient();
  if (!admin) return { error: "No admin client", sent: 0 };

  const now = Date.now();

  const { data: prefs, error: prefErr } = await admin
    .from("user_preferences")
    .select("user_id, remind_before_hours, timezone")
    .eq("email_reminders_enabled", true);

  if (prefErr) throw new Error(prefErr.message);

  let sent = 0;

  for (const pref of prefs ?? []) {
    const { data: userData, error: userErr } = await admin.auth.admin.getUserById(pref.user_id);
    if (userErr || !userData?.user?.email) continue;

    const { data: assignments } = await admin
      .from("assignments")
      .select("id, title, due_at, status")
      .eq("user_id", pref.user_id)
      .neq("status", "done");

    const dueSoon = (assignments ?? []).filter((a) =>
      matchesReminderWindow(a.due_at, pref.remind_before_hours ?? [24, 2], now),
    );

    if (dueSoon.length === 0) continue;

    const lines = dueSoon
      .map((a) => `• ${a.title} — due ${new Date(a.due_at).toLocaleString()}`)
      .join("\n");

    await sendReminderEmail({
      to: userData.user.email,
      subject: `K12 Planner: ${dueSoon.length} assignment(s) due soon`,
      text: `Hi,\n\nReminders for your upcoming work:\n\n${lines}\n\nOpen your planner: https://k12projec.vercel.app/app\n`,
    });

    sent += 1;
  }

  return { sent, users_checked: prefs?.length ?? 0 };
}
