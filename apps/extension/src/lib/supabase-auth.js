import { createClient } from "@supabase/supabase-js";
import { getSession, setSession } from "./storage";

/**
 * Purpose: Supabase auth for extension with token refresh.
 */

function client(settings) {
  return createClient(settings.supabaseUrl, settings.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function signInWithPassword(settings, email, password) {
  const supabase = client(settings);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("No session returned");
  await setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  });
}

export async function signOut() {
  await setSession(null);
}

/** Refresh access token if expired or expiring within 5 minutes. */
export async function ensureFreshSession(settings) {
  const session = await getSession();
  if (!session?.refresh_token) return session;

  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
  const needsRefresh = !expiresAt || expiresAt - Date.now() < 5 * 60 * 1000;
  if (!needsRefresh) return session;

  const supabase = client(settings);
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: session.refresh_token,
  });
  if (error || !data.session) return session;

  const next = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  };
  await setSession(next);
  return next;
}
