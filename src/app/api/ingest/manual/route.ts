import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManualIngestSchema } from "@/lib/schemas";
import { processSource } from "@/lib/pipeline";

/**
 * POST /api/ingest/manual — "Tell Donna" free text.
 * Stores a manual source and runs it through the same LLM extraction →
 * deterministic routing pipeline as meetings and email. Auto-tier actions
 * may fire immediately (safe: the executor strips unapproved attendees and
 * external sends never auto-fire).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = ManualIngestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const text = parsed.data.text.trim();

    const db = createAdminClient();

    // Remember the browser's timezone so relative dates ("tomorrow") resolve
    // correctly here AND in webhook/cron sources that have no browser context.
    const tz = parsed.data.timezone;
    if (tz) {
      const { data: prof } = await db
        .from("profiles")
        .select("settings")
        .eq("id", user.id)
        .single();
      const settings = (prof?.settings as Record<string, unknown>) ?? {};
      if (settings.timezone !== tz) {
        await db
          .from("profiles")
          .update({ settings: { ...settings, timezone: tz } })
          .eq("id", user.id);
      }
    }
    const { data: source, error } = await db
      .from("sources")
      .insert({
        user_id: user.id,
        kind: "manual",
        title: text.slice(0, 60),
        raw: { text },
        occurred_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error || !source) {
      return NextResponse.json({ error: error?.message ?? "Insert failed" }, { status: 500 });
    }

    const result = await processSource(user.id, source.id);
    return NextResponse.json({ ok: true, created: result.created, summary: result.summary });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
