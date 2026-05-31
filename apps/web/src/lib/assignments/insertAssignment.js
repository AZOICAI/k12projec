import {
  insertRowWithFlags,
  isMissingAssignmentColumn,
} from "@/lib/assignments/assignmentFlags";

function stripOptionalColumns(row) {
  const next = { ...row };
  delete next.is_redo;
  delete next.is_recovery;
  delete next.is_low_grade;
  delete next.grade_percent;
  delete next.score;
  delete next.points_possible;
  delete next.redo_of_assignment_id;
  delete next.redo_dismissed;
  return next;
}

/** Insert assignment; omits optional columns if DB migrations not applied yet. */
export async function insertAssignment(supabase, row) {
  let dbRow = insertRowWithFlags(row);
  let res = await supabase.from("assignments").insert(dbRow).select("*").single();

  if (res.error && isMissingAssignmentColumn(res.error)) {
    res = await supabase.from("assignments").insert(stripOptionalColumns(row)).select("*").single();
  }

  return res;
}
