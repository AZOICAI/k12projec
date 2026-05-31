import { apiPaths } from "@k12/shared";

/** Default due date for a one-tap redo (one week out, 5 PM local). */
export function defaultRedoDueAt(from = new Date()) {
  const due = new Date(from);
  due.setDate(due.getDate() + 7);
  due.setHours(17, 0, 0, 0);
  return due.toISOString();
}

export function buildRedoCreateBody(original) {
  return {
    course_id: original.course_id,
    title: `Redo: ${original.title}`,
    due_at: defaultRedoDueAt(),
    is_redo: true,
    redo_of_assignment_id: original.id,
    status: "todo",
  };
}

export async function createRedoForAssignment(original) {
  const res = await fetch(apiPaths.assignments, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildRedoCreateBody(original)),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  const data = await res.json();
  return { ok: true, data };
}
