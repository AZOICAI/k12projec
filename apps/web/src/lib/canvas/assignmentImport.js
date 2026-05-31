/** Decide which Canvas assignments to import and what status to use. */

import { extractCanvasGrades } from "@/lib/assignments/grades";

const IMPORT_PAST_DAYS = 30;
const ARCHIVE_PAST_DAYS = 90;

const DONE_SUBMISSION_STATES = new Set([
  "graded",
  "submitted",
  "pending_review",
  "complete",
  "completed",
]);

export function shouldImportCanvasAssignment(ca, now = Date.now()) {
  if (ca.workflow_state === "deleted") return false;
  if (!ca.due_at) return false;

  const due = new Date(ca.due_at).getTime();
  if (Number.isNaN(due)) return false;

  const pastCutoff = now - IMPORT_PAST_DAYS * 24 * 60 * 60 * 1000;
  return due >= pastCutoff;
}

/** True when the current user's Canvas submission is turned in or graded. */
export function isSubmissionComplete(submission) {
  if (!submission || typeof submission !== "object") return false;
  if (submission.excused) return true;
  if (submission.late && submission.submitted_at) return true;
  const state = submission.workflow_state;
  if (state && DONE_SUBMISSION_STATES.has(state)) return true;
  if (state === "unsubmitted") return false;
  if (submission.submitted_at) return true;
  if (submission.graded_at) return true;
  if (submission.score != null && submission.score !== "") return true;
  if (submission.grade != null && String(submission.grade).trim() !== "") return true;
  return false;
}

/** Map Canvas assignment + optional local row to todo | done. */
export function resolveCanvasStatus(ca, existingStatus = null) {
  if (isSubmissionComplete(ca.submission)) return "done";
  if (ca.has_submitted_submissions) return "done";

  const grades = extractCanvasGrades(ca);
  if (grades.grade_percent != null || grades.score != null) return "done";

  if (ca.submission?.workflow_state === "unsubmitted") return "todo";

  // Canvas often omits submission on list; don't reopen work already marked done locally.
  if (existingStatus === "done") return "done";

  return "todo";
}

/** Local row has Canvas grades but status was never updated. */
export function shouldReconcileGradedAsDone(assignment) {
  if (!assignment || assignment.status === "done") return false;
  if (assignment.grade_percent != null && !Number.isNaN(Number(assignment.grade_percent))) {
    return true;
  }
  if (
    assignment.score != null &&
    assignment.points_possible != null &&
    Number(assignment.points_possible) > 0
  ) {
    return true;
  }
  return false;
}

export { ARCHIVE_PAST_DAYS };
