import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/adapters";
import { syncGmailForUser } from "@/lib/google/gmail-sync";

/**
 * POST /api/sync/gmail — the "Sync now" button (signed-in user).
 * GET  /api/sync/gmail — the Vercel cron (sends GET with
 *                        Authorization: Bearer CRON_SECRET); syncs every
 *                        connected user.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // OAuth app itself not configured → demo mode by design
    if (isDemoMode("google")) {
      return NextResponse.json({
        ok: true,
        demo: true,
        detail: "Google OAuth not configured — see SETUP.md §3 for live inbox sync.",
      });
    }

    const result = await syncGmailForUser(user.id);
    if (result.error === "not_connected") {
      // App is configured but this user has no stored tokens — they signed
      // in before token capture existed. Signing in again fixes it.
      return NextResponse.json({
        ok: false,
        connected: false,
        detail: "Google tokens missing — sign out and back in to connect your inbox.",
      });
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isDemoMode("google")) {
    return NextResponse.json({ ok: true, demo: true, synced_users: 0 });
  }

  const db = createAdminClient();
  const { data: connections } = await db
    .from("google_connections")
    .select("user_id")
    .eq("provider", "google")
    .eq("status", "connected");

  let synced = 0;
  let messages = 0;
  for (const conn of connections ?? []) {
    try {
      const result = await syncGmailForUser(conn.user_id);
      if (result.ok) {
        synced++;
        messages += result.new_messages;
      }
    } catch (err) {
      console.error(`cron sync failed for ${conn.user_id}:`, err);
    }
  }
  return NextResponse.json({ ok: true, synced_users: synced, new_messages: messages });
}
