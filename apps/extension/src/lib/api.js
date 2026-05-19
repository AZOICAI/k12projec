import { apiPaths, fullUrl, isDueSoon } from "@k12/shared";
import { ensureFreshSession } from "./supabase-auth";
import { getSession, getSettings } from "./storage";

async function authHeaders() {
  const settings = await getSettings();
  if (!settings?.supabaseUrl) throw new Error("Not configured");
  const session = await ensureFreshSession(settings);
  if (!session?.access_token) {
    throw new Error("Not signed in. Open extension settings to sign in.");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function apiFetch(path, init) {
  const settings = await getSettings();
  if (!settings?.appUrl) {
    throw new Error("App URL not configured. Open extension settings.");
  }
  const url = fullUrl(settings.appUrl, path);
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(await authHeaders()),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

export async function fetchCourses() {
  return apiFetch(apiPaths.courses);
}

export async function createAssignment(body) {
  await apiFetch(apiPaths.assignments, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Count non-done assignments due within 48 hours (shared rule with web). */
export async function countDueSoon() {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const q = new URLSearchParams({
    from: now.toISOString(),
    to: in48h.toISOString(),
  });
  const items = await apiFetch(`${apiPaths.assignments}?${q}`);
  return items.filter((a) => a.status !== "done" && isDueSoon(a.due_at, now.getTime())).length;
}
