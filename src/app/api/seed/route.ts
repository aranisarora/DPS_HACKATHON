import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routeAction } from "@/lib/autonomy/router";
import { executeAction } from "@/lib/executor";
import {
  DEMO_TRANSCRIPT,
  DEMO_ACTIONS,
  DEMO_CONTACTS,
  DEMO_BUSINESS_PROFILE,
} from "@/lib/demo-data";
import type { ActionType, BlastRadius } from "@/lib/types";

/**
 * POST /api/seed — seed the demo dataset for the signed-in user.
 * Idempotent: skips if the demo source already exists. The seeded
 * transcript uses Recall's exact JSON schema, so this exercises the same
 * pipeline as a live meeting.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAdminClient();

    const { data: existing } = await db
      .from("sources")
      .select("id")
      .eq("user_id", user.id)
      .eq("external_id", DEMO_TRANSCRIPT.bot_id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ ok: true, already_seeded: true });
    }

    // Contacts (roster)
    await db.from("contacts").upsert(
      DEMO_CONTACTS.map((c) => ({ ...c, user_id: user.id })),
      { onConflict: "user_id,email" }
    );

    // Business profile
    await db.from("business_profile").upsert(
      {
        user_id: user.id,
        version: 1,
        questionnaire: DEMO_BUSINESS_PROFILE.questionnaire,
        profile: DEMO_BUSINESS_PROFILE.profile,
        confirmed: true,
      },
      { onConflict: "user_id,version" }
    );

    // Meeting source (Recall schema)
    const { data: source, error: srcErr } = await db
      .from("sources")
      .insert({
        user_id: user.id,
        kind: "meeting",
        title: DEMO_TRANSCRIPT.meeting_metadata.title,
        raw: DEMO_TRANSCRIPT,
        participants: DEMO_TRANSCRIPT.media_shortcuts.transcript.data.participants.map(
          (p) => ({ name: p.name, email: p.email })
        ),
        occurred_at: new Date(Date.now() - 45 * 60_000).toISOString(),
        processed: true,
        external_id: DEMO_TRANSCRIPT.bot_id,
      })
      .select("id")
      .single();
    if (srcErr || !source) throw new Error(srcErr?.message ?? "seed source failed");

    // Proposed actions — routed by the REAL router, not hardcoded tiers
    for (const a of DEMO_ACTIONS) {
      const tier = routeAction({
        action_type: a.action_type as ActionType,
        confidence: a.confidence,
        blast_radius: a.blast_radius as BlastRadius,
        reversible: a.reversible,
        feasible: true,
      });
      const { data: row } = await db
        .from("proposed_actions")
        .insert({
          user_id: user.id,
          source_id: source.id,
          action_type: a.action_type,
          title: a.title,
          description: a.description,
          params: a.params,
          source_quote: a.source_quote,
          confidence: a.confidence,
          blast_radius: a.blast_radius,
          reversible: a.reversible,
          tier,
          minutes_saved: a.minutes_saved,
        })
        .select("id")
        .single();
      if (!row) continue;
      await db.from("audit_log").insert({
        user_id: user.id,
        proposed_action_id: row.id,
        event: "routed",
        actor: "system",
        detail: { tier, confidence: a.confidence, blast_radius: a.blast_radius },
      });
      if (tier === "auto") {
        await executeAction(row.id, { approvedByOwner: false });
      }
    }

    return NextResponse.json({ ok: true, seeded: DEMO_ACTIONS.length });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
