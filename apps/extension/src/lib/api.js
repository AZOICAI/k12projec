import { apiPaths, fullUrl } from "@k12/shared";
import { buildWorkQueue } from "./workQueue";
import { ensureFreshSession } from "./supabase-auth";
import { getSettings } from "./storage";

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

/** Load assignments for badge + popup (overdue through next 2 weeks). */
export async function fetchAssignmentsWindow() {
  const now = new Date();
  const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const q = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return apiFetch(`${apiPaths.assignments}?${q}`);
}

export async function fetchWorkSnapshot() {
  const items = await fetchAssignmentsWindow();
  return buildWorkQueue(items);
}
