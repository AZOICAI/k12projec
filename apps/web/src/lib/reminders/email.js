/** Send reminder email via Resend (optional). */

export async function sendReminderEmail({ to, subject, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL ?? "K12 Planner <onboarding@resend.dev>";

  if (!apiKey) {
    console.info("[reminders] RESEND_API_KEY not set; skip email to", to);
    return { sent: false, reason: "no_api_key" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || "Resend API failed");
  }

  return { sent: true };
}
