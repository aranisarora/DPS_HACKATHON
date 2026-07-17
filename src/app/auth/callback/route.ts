import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { storeGoogleConnection } from "@/lib/google/tokens";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Supabase surfaces Google's OAuth tokens on the session exactly once,
      // here. Persist them (encrypted) or Gmail/Calendar can never go live.
      const session = data.session;
      if (session?.provider_token && session.user) {
        try {
          await storeGoogleConnection(session.user.id, {
            accessToken: session.provider_token,
            refreshToken: session.provider_refresh_token,
            expiresIn: 3600,
          });
        } catch (err) {
          // Token storage must never block login (e.g. TOKEN_ENCRYPTION_KEY
          // missing locally) — Donna just stays in demo mode.
          console.error("google connection store failed:", err);
        }
      }
      return NextResponse.redirect(`${origin}/app`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
