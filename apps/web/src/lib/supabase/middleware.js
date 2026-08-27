import { NextResponse } from "next/server";
import { LOCAL_AUTH_COOKIE } from "@/lib/dev-auth";

export async function updateSession(request) {
  const localUsername = request.cookies.get(LOCAL_AUTH_COOKIE)?.value;
  const path = request.nextUrl.pathname;

  if (path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = localUsername ? "/app" : "/login";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/app")) {
    if (!localUsername) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  if (localUsername && (path === "/login" || path === "/signup")) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next({ request });
}
