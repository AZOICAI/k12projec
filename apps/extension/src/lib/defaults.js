/** Baked-in at build time from apps/extension/.env */
export const DEFAULT_APP_URL =
  (import.meta.env.VITE_APP_URL ?? "https://k12projec.vercel.app").replace(/\/$/, "");

export const DEFAULT_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const DEFAULT_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export function buildDefaultSettings() {
  return {
    appUrl: DEFAULT_APP_URL,
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
    extensionNotificationsEnabled: false,
  };
}

export function isConfigured(settings) {
  return Boolean(settings?.appUrl && settings?.supabaseUrl && settings?.supabaseAnonKey);
}
