import { parseLocalDateString } from "@k12/shared";

/** Build one study block payload for a plan-my-day entry. */
export function buildStudyBlockPayload({ title, startTime, durationMinutes, planDate }) {
  const trimmed = title?.trim();
  if (!trimmed || !startTime || !planDate) return null;

  const day = parseLocalDateString(planDate);
  if (!day) return null;

  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes < 5) return null;

  const [h, m] = startTime.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const start = new Date(day);
  start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + minutes * 60 * 1000);

  return {
    title: trimmed,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
  };
}
