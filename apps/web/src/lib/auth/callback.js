import { createServerClient } from "@supabase/ssr";
import { isEmailAllowedForSignup } from "@/lib/auth/signup-policy";

export function createAuthCallbackClient(cookieStore) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* ignore when called from Server Component */
          }
        },
      },
    },
  );
}

export async function finishAuthSession(supabase, origin, next) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email && !isEmailAllowedForSignup(user.email)) {
    await supabase.auth.signOut();
    return `${origin}/login?error=domain`;
  }

  return `${origin}${next}`;
}
