/** Convert class % to 4.0 scale points. */
export function percentToGpaPoints(percent) {
  const p = Number(percent);
  if (!Number.isFinite(p)) return null;
  return Math.round((p / 100) * 4 * 100) / 100;
}

/** Weighted courses get +1.0 on the 4.0 scale (cap 5.0). */
export function courseGpaPoints(percent, isWeighted) {
  const base = percentToGpaPoints(percent);
  if (base == null) return null;
  if (isWeighted) return Math.min(5, Math.round((base + 1) * 100) / 100);
  return base;
}

export function computeGpaSummary(courses) {
  const graded = courses.filter((c) => c.current_grade_percent != null);
  if (!graded.length) {
    return { unweighted: null, weighted: null, graded_count: 0 };
  }

  let uwSum = 0;
  let wSum = 0;
  let credits = 0;

  for (const c of graded) {
    const pct = Number(c.current_grade_percent);
    const hrs = Number(c.credit_hours ?? 1) || 1;
    const uw = percentToGpaPoints(pct);
    const w = courseGpaPoints(pct, Boolean(c.is_weighted));
    if (uw == null || w == null) continue;
    uwSum += uw * hrs;
    wSum += w * hrs;
    credits += hrs;
  }

  if (!credits) return { unweighted: null, weighted: null, graded_count: 0 };

  return {
    unweighted: Math.round((uwSum / credits) * 100) / 100,
    weighted: Math.round((wSum / credits) * 100) / 100,
    graded_count: graded.length,
  };
}
