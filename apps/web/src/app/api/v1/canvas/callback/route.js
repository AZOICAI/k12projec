import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCanvasCode } from "@/lib/canvas/config";
import { saveCanvasConnection } from "@/lib/canvas/connection";
import { requireUser } from "@/lib/supabase/api";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/app/settings?canvas=error`);
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("canvas_oauth_state")?.value;
  const domain = cookieStore.get("canvas_oauth_domain")?.value;

  cookieStore.delete("canvas_oauth_state");
  cookieStore.delete("canvas_oauth_domain");

  if (!code || !state || !expectedState || state !== expectedState || !domain) {
    return NextResponse.redirect(`${origin}/app/settings?canvas=error`);
  }

  const { user } = await requireUser(request);
  if (!user) {
    return NextResponse.redirect(`${origin}/login?next=/app/settings`);
  }

  try {
    const tokens = await exchangeCanvasCode(domain, code);
    await saveCanvasConnection(user.id, domain, tokens);
    return NextResponse.redirect(`${origin}/app/settings?canvas=connected`);
  } catch {
    return NextResponse.redirect(`${origin}/app/settings?canvas=error`);
  }
}
