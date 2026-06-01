import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAuthCallbackClient, finishAuthSession } from "@/lib/auth/callback";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/app";

  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  if (oauthError) {
    const msg = encodeURIComponent(String(oauthError).slice(0, 200));
    return NextResponse.redirect(`${origin}/login?error=auth&detail=${msg}`);
  }

  const cookieStore = await cookies();
  const supabase = createAuthCallbackClient(cookieStore);

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const dest = await finishAuthSession(supabase, origin, next);
      return NextResponse.redirect(dest);
    }
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) {
      const dest = await finishAuthSession(supabase, origin, next);
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
