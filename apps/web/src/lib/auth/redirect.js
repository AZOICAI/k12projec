/**
 * Auth redirect URLs for Supabase (email confirm, OAuth).
 * Client: use window.location.origin. Server fallback: NEXT_PUBLIC_APP_URL.
 */

export function getAuthCallbackUrl(originOrPath) {
  if (typeof window !== "undefined") {
    const base = window.location.origin;
    return `${base}/auth/callback?next=/app`;
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (configured) {
    return `${configured}/auth/callback?next=/app`;
  }

  if (originOrPath?.startsWith("http")) {
    return `${originOrPath.replace(/\/$/, "")}/auth/callback?next=/app`;
  }

  return "/auth/callback?next=/app";
}
