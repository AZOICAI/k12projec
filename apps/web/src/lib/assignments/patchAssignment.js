import { apiPaths } from "@k12/shared";

/** PATCH assignment fields from the client. */
export async function patchAssignment(id, body) {
  const res = await fetch(apiPaths.assignment(id), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.ok;
}
