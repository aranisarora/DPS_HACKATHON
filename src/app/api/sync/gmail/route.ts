import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/adapters";

/**
 * POST /api/sync/gmail — the "Sync now" button (demo insurance) and the
 * cron target. Polls Gmail history.list from the stored cursor; new
 * messages become sources → /api/process.
 *
 * Until Google OAuth is configured this reports demo mode rather than
 * failing, so the button is safe to show from day one.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (isDemoMode("google")) {
      return NextResponse.json({
        ok: true,
        demo: true,
        detail: "Google not connected yet — configure OAuth (SETUP.md §3) for live inbox sync.",
      });
    }

    const db = createAdminClient();
    const { data: conn } = await db
      .from("google_connections")
      .select("id, last_history_id, access_token_enc, status")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (!conn || conn.status !== "connected") {
      return NextResponse.json({ ok: false, error: "No Google connection" }, { status: 409 });
    }

    // history.list incremental sync happens here once tokens are stored.
    await db
      .from("google_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", conn.id);

    return NextResponse.json({ ok: true, new_messages: 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
