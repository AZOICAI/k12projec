import { createAdminClient } from "@/lib/supabase/admin";
import { refreshCanvasToken } from "./config";

export async function getCanvasConnection(userId) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("canvas_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getValidAccessToken(connection) {
  if (!connection) return null;

  if (connection.token_expires_at) {
    const expires = new Date(connection.token_expires_at).getTime();
    if (expires <= Date.now()) {
      throw new Error(
        connection.auth_type === "personal"
          ? "Your Canvas token expired. Create a new one in Canvas and reconnect."
          : "Canvas session expired. Connect again in Settings.",
      );
    }
  }

  if (connection.auth_type === "personal" || !connection.refresh_token) {
    return connection.access_token;
  }

  const expires = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const stillValid = expires > Date.now() + 60_000;

  if (stillValid) return connection.access_token;

  if (!connection.refresh_token) return connection.access_token;

  const tokens = await refreshCanvasToken(connection.canvas_domain, connection.refresh_token);
  const admin = createAdminClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  await admin
    .from("canvas_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? connection.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", connection.user_id);

  return tokens.access_token;
}

export async function saveCanvasConnection(userId, domain, tokens) {
  const admin = createAdminClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  const { error } = await admin.from("canvas_connections").upsert({
    user_id: userId,
    canvas_domain: domain,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    token_expires_at: expiresAt,
    auth_type: "oauth",
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function savePersonalCanvasConnection(userId, domain, accessToken, tokenExpiresAt) {
  const admin = createAdminClient();

  const { error } = await admin.from("canvas_connections").upsert({
    user_id: userId,
    canvas_domain: domain,
    access_token: accessToken,
    refresh_token: null,
    token_expires_at: tokenExpiresAt ?? null,
    auth_type: "personal",
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function deleteCanvasConnection(userId) {
  const admin = createAdminClient();
  const { error } = await admin.from("canvas_connections").delete().eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function touchLastSynced(userId) {
  const admin = createAdminClient();
  await admin
    .from("canvas_connections")
    .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}
