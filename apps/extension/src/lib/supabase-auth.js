import { createClient } from "@supabase/supabase-js";
import { setSession } from "./storage";

export async function signInWithPassword(settings, email, password) {
  const supabase = createClient(settings.supabaseUrl, settings.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
