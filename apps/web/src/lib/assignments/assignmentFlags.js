const MISSING_COLUMN_MSG = [
  "is_recovery",
  "is_low_grade",
  "grade_percent",
  "redo_of_assignment",
  "redo_dismissed",
  "schema cache",
];

export function isMissingAssignmentColumn(error) {
  const msg = error?.message ?? "";
  return MISSING_COLUMN_MSG.some((s) => msg.includes(s));
}

/** DB row → app fields is_redo / is_low_grade. */
export function normalizeAssignmentRow(row) {
  if (!row) return row;
  const { is_recovery, is_low_grade, ...rest } = row;
  return {
    ...rest,
    is_redo: Boolean(is_recovery),
    is_low_grade: Boolean(is_low_grade),
    redo_dismissed: Boolean(rest.redo_dismissed),
  };
}

export function normalizeAssignmentRows(rows) {
  return (rows ?? []).map((row) => normalizeAssignmentRow(row));
}

export function insertRowWithFlags(row) {
  const { is_redo, is_low_grade, ...rest } = row;
  const out = { ...rest };
  if (is_redo != null) out.is_recovery = is_redo;
  if (is_low_grade != null) out.is_low_grade = is_low_grade;
  return out;
}

export function updatePayloadWithFlags(data) {
  if (!data) return data;
  const { is_redo, is_low_grade, ...rest } = data;
  const out = { ...rest };
  if (is_redo !== undefined) out.is_recovery = is_redo;
  if (is_low_grade !== undefined) out.is_low_grade = is_low_grade;
  return out;
}
