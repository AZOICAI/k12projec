/** Canvas OAuth + API configuration (server-only). */

/** School OAuth developer key (IT-provided). */
export function isCanvasOAuthConfigured() {
  return Boolean(
    process.env.CANVAS_CLIENT_ID &&
      process.env.CANVAS_CLIENT_SECRET &&
      process.env.CANVAS_REDIRECT_URI,
  );
}

/** User-generated token from Canvas → Settings → New Access Token (beta / solo testing). */
export function isPersonalCanvasTokenAllowed() {
  return process.env.CANVAS_ALLOW_PERSONAL_TOKEN !== "false";
}

export function isCanvasSyncAvailable() {
  return isCanvasOAuthConfigured() || isPersonalCanvasTokenAllowed();
}

export async function verifyCanvasAccessToken(domain, accessToken) {
  const res = await fetch(`https://${domain}/api/v1/users/self`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Canvas rejected this token. Check domain and token.");
  }
  return res.json();
}

export function getCanvasRedirectUri() {
  return process.env.CANVAS_REDIRECT_URI?.trim() ?? "";
}

export function normalizeCanvasDomain(input) {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, "");
  domain = domain.replace(/\/$/, "");
  return domain;
}

export function canvasAuthUrl(domain, state) {
  const clientId = process.env.CANVAS_CLIENT_ID;
  const redirectUri = encodeURIComponent(getCanvasRedirectUri());
  const scope = encodeURIComponent("url:GET|/api/v1/courses url:GET|/api/v1/courses/:course_id/assignments");
  return `https://${domain}/login/oauth2/auth?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&state=${encodeURIComponent(state)}&scope=${scope}`;
}

export async function exchangeCanvasCode(domain, code) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.CANVAS_CLIENT_ID,
    client_secret: process.env.CANVAS_CLIENT_SECRET,
    redirect_uri: getCanvasRedirectUri(),
    code,
  });

  const res = await fetch(`https://${domain}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Canvas token exchange failed");
  }

  return res.json();
}

export async function refreshCanvasToken(domain, refreshToken) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.CANVAS_CLIENT_ID,
    client_secret: process.env.CANVAS_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch(`https://${domain}/login/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error("Canvas token refresh failed");
  }

  return res.json();
}
