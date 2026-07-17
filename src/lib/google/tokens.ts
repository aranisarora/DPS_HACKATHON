import { createAdminClient } from "../supabase/admin";
import { encryptToken, decryptToken } from "../crypto";

/**
 * ===== Google token store =====
 *
 * Tokens arrive via Supabase's Google sign-in (provider_token /
 * provider_refresh_token on the session — the login page already requests
 * Gmail/Calendar/Tasks scopes with access_type=offline). They are encrypted
 * at rest in google_connections (service-role only, no RLS policies) and
 * refreshed here server-side using the same Google OAuth client that
 * Supabase auth is configured with.
 */

const EXPIRY_MARGIN_MS = 60_000;

export async function storeGoogleConnection(
  userId: string,
  tokens: { accessToken: string; refreshToken?: string | null; expiresIn?: number | null }
): Promise<void> {
  const db = createAdminClient();
  const expiresAt = new Date(
    Date.now() + (tokens.expiresIn ?? 3600) * 1000
  ).toISOString();

  // Preserve an existing refresh token when Google doesn't resend one
  // (it only returns refresh_token on the first consent).
  const { data: existing } = await db
    .from("google_connections")
    .select("refresh_token_enc")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  await db.from("google_connections").upsert(
    {
      user_id: userId,
      provider: "google",
      access_token_enc: encryptToken(tokens.accessToken),
      refresh_token_enc: tokens.refreshToken
        ? encryptToken(tokens.refreshToken)
        : existing?.refresh_token_enc ?? null,
      token_expires_at: expiresAt,
      status: "connected",
    },
    { onConflict: "user_id,provider" }
  );
}

/**
 * Returns a valid access token for the user, refreshing if it expires within
 * a minute. Returns null when the user has no usable connection — callers
 * fall back to demo mode rather than failing.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const db = createAdminClient();
  const { data: conn } = await db
    .from("google_connections")
    .select("id, access_token_enc, refresh_token_enc, token_expires_at, status")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (!conn || conn.status !== "connected" || !conn.access_token_enc) return null;

  const expiresAt = conn.token_expires_at ? Date.parse(conn.token_expires_at) : 0;
  if (expiresAt - Date.now() > EXPIRY_MARGIN_MS) {
    try {
      return decryptToken(conn.access_token_enc);
    } catch {
      return null;
    }
  }

  // Expired (or nearly) — refresh.
  if (!conn.refresh_token_enc) return null;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const refreshToken = decryptToken(conn.refresh_token_enc);
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      // invalid_grant = user revoked access; mark so the UI can prompt re-connect
      if (text.includes("invalid_grant")) {
        await db
          .from("google_connections")
          .update({ status: "revoked" })
          .eq("id", conn.id);
      }
      return null;
    }
    const data = await res.json();
    await db
      .from("google_connections")
      .update({
        access_token_enc: encryptToken(data.access_token),
        token_expires_at: new Date(
          Date.now() + (data.expires_in ?? 3600) * 1000
        ).toISOString(),
      })
      .eq("id", conn.id);
    return data.access_token as string;
  } catch {
    return null;
  }
}
