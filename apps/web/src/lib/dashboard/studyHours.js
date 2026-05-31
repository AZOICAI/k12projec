/** Sum scheduled study block minutes in a time range. */
export function sumStudyMinutesInRange(blocks, rangeStart, rangeEnd) {
  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();
  let total = 0;

  for (const b of blocks ?? []) {
    const s = new Date(b.starts_at).getTime();
    const e = new Date(b.ends_at).getTime();
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) continue;
    if (s < startMs || s > endMs) continue;
    total += (e - s) / (60 * 1000);
  }

  return Math.round(total);
}

export function formatStudyMinutes(minutes) {
  if (!minutes || minutes < 1) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
