import { apiPaths } from "@k12/shared";

/** Log minutes completed on the Focus timer (only call after time actually ran). */
export async function logStudySession(durationMinutes) {
  const minutes = Math.max(1, Math.min(300, Math.round(durationMinutes)));
  const res = await fetch(apiPaths.studySessions, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duration_minutes: minutes }),
  });
  return res.ok;
}
