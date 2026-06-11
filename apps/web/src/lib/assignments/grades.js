/** Default ceiling for "low" when course has no target set. */
export const DEFAULT_LOW_GRADE_THRESHOLD = 70;

export function getLowGradeThreshold(course) {
  const target = course?.target_grade_percent;
  if (target != null && !Number.isNaN(Number(target))) {
    return Number(target);
  }
  return DEFAULT_LOW_GRADE_THRESHOLD;
}

export function computeGradePercent(score, pointsPossible) {
  const s = Number(score);
  const p = Number(pointsPossible);
  if (!Number.isFinite(s) || !Number.isFinite(p) || p <= 0) return null;
  const pct = (s / p) * 100;
  if (!Number.isFinite(pct)) return null;
  return Math.round(pct * 10) / 10;
}

/** Parse Canvas assignment + submission into stored grade fields. */
export function extractCanvasGrades(canvasAssignment) {
  const pointsPossible =
    canvasAssignment.points_possible != null && canvasAssignment.points_possible !== ""
      ? Number(canvasAssignment.points_possible)
      : null;

  const sub = canvasAssignment.submission;
  let score = null;
  if (sub?.score != null && sub.score !== "") {
    const n = Number(sub.score);
    if (Number.isFinite(n)) score = n;
  }

  let gradePercent = computeGradePercent(score, pointsPossible);
  if (gradePercent == null && sub?.grade != null) {
    const g = String(sub.grade).trim();
    const pct = g.match(/^([\d.]+)\s*%/);
    if (pct) gradePercent = Math.min(100, Number(pct[1]));
    const frac = g.match(/^([\d.]+)\s*\/\s*([\d.]+)/);
    if (frac && gradePercent == null) {
      gradePercent = computeGradePercent(Number(frac[1]), Number(frac[2]));
    }
  }

  return {
    score,
    points_possible: Number.isFinite(pointsPossible) ? pointsPossible : null,
    grade_percent: gradePercent,
  };
}

export function courseById(courses, courseId) {
  return courses?.find((c) => c.id === courseId) ?? null;
}

/**
 * Assignment counts as needing redo (low score, not dismissed, no redo scheduled).
 *
 * Driven by the actual Canvas grade: a completed assignment with a score below the
 * class target is exactly what grade recovery is for, so "done" status does NOT
 * exclude it. A real grade always wins over the manual is_low_grade flag, so stale
 * manual flags can never resurface work that now has a passing score.
 */
export function assignmentNeedsRedo(assignment, courses, allAssignments) {
  if (assignment.redo_dismissed) return false;
  if (assignment.redo_of_assignment_id) return false;
  if (assignment.is_redo) return false;

  const hasRedoChild = (allAssignments ?? []).some(
    (a) => a.redo_of_assignment_id === assignment.id,
  );
  if (hasRedoChild) return false;

  const course = courseById(courses, assignment.course_id);
  const threshold = getLowGradeThreshold(course);

  const gradePercent =
    assignment.grade_percent != null && !Number.isNaN(Number(assignment.grade_percent))
      ? Number(assignment.grade_percent)
      : computeGradePercent(assignment.score, assignment.points_possible);

  if (gradePercent != null) {
    return gradePercent < threshold;
  }

  return Boolean(assignment.is_low_grade);
}

/**
 * Estimate the course percent if this assignment were redone for full credit.
 * Uses total earned/possible points across the course's graded work to size the
 * bump, applied on top of the displayed course grade. Returns null when there
 * isn't enough data to estimate.
 */
export function estimateRedoImpact(assignment, courseAssignments, courseGradePercent) {
  const score = Number(assignment.score);
  const points = Number(assignment.points_possible);
  if (!Number.isFinite(score) || !Number.isFinite(points) || points <= 0) return null;

  let totalPoints = 0;
  for (const a of courseAssignments ?? []) {
    const p = Number(a.points_possible);
    const s = Number(a.score);
    if (Number.isFinite(p) && p > 0 && Number.isFinite(s)) {
      totalPoints += p;
    }
  }
  if (totalPoints <= 0) return null;

  const base =
    courseGradePercent != null && Number.isFinite(Number(courseGradePercent))
      ? Number(courseGradePercent)
      : null;
  if (base == null) return null;

  const deltaPct = ((points - score) / totalPoints) * 100;
  if (!Number.isFinite(deltaPct) || deltaPct <= 0) return null;

  const estimated = Math.min(100, base + deltaPct);
  return Math.round(estimated * 10) / 10;
}

export function formatGradeLabel(assignment) {
  if (assignment.grade_percent != null) {
    return `${assignment.grade_percent}%`;
  }
  if (assignment.score != null && assignment.points_possible != null) {
    return `${assignment.score}/${assignment.points_possible}`;
  }
  return "Low grade";
}
