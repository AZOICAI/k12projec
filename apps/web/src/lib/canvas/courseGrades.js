/** Parse Canvas enrollment grades into a course % (0–100). */

export function parseEnrollmentGradePercent(grades) {
  if (!grades || typeof grades !== "object") return null;

  const raw = grades.current_score ?? grades.unposted_current_score;
  if (raw == null || raw === "") return null;

  const n = Number(raw);
  if (!Number.isFinite(n)) return null;

  // Student enrollment current_score is usually percent (0–100).
  if (n >= 0 && n <= 100) return Math.round(n * 10) / 10;

  return null;
}

/** Fallback: average graded assignment % for a course. */
export function averageAssignmentGradePercent(assignments) {
  const graded = assignments.filter(
    (a) => a.grade_percent != null && !Number.isNaN(Number(a.grade_percent)),
  );
  if (!graded.length) return null;

  const sum = graded.reduce((s, a) => s + Number(a.grade_percent), 0);
  return Math.round((sum / graded.length) * 10) / 10;
}
