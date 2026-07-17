import { createAdminClient } from "./supabase/admin";
import { extractActions } from "./llm/extract";
import { routeAction } from "./autonomy/router";
import { minutesSavedFor } from "./minutes";
import { executeAction } from "./executor";
import type { ActionType } from "./types";

/**
 * ===== The pipeline =====
 * source → Fable 5 extraction → deterministic routing → proposed_actions.
 * Auto-tier actions fire immediately; approve-tier wait in the inbox;
 * suggest-tier are read-only.
 *
 * Callable from anywhere server-side (API routes, the Recall webhook, the
 * Gmail sync cron) — callers are responsible for authenticating the user.
 */
export async function processSource(
  userId: string,
  sourceId: string
): Promise<{ created: number; summary: string }> {
  const db = createAdminClient();

  const { data: source } = await db
    .from("sources")
    .select("*")
    .eq("id", sourceId)
    .eq("user_id", userId)
    .single();
  if (!source) throw new Error("Source not found");

  const { data: profileRow } = await db
    .from("business_profile")
    .select("profile")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: teammates } = await db
    .from("contacts")
    .select("name, email")
    .eq("user_id", userId)
    .eq("is_teammate", true);
  const { data: userProfile } = await db
    .from("profiles")
    .select("settings")
    .eq("id", userId)
    .single();

  // Flatten transcript/email into plain text for the model (content = DATA)
  const content =
    typeof source.raw === "string" ? source.raw : JSON.stringify(source.raw);

  const extraction = await extractActions(source.kind, content, {
    businessProfile: profileRow?.profile,
    teammates: (teammates ?? []).map((t) => ({ name: t.name ?? t.email, email: t.email })),
  });

  const settings = userProfile?.settings ?? {};
  const thresholds = settings.autonomy;
  const minuteOverrides = settings.minutes_saved;

  const created: string[] = [];
  for (const a of extraction.actions) {
    // ===== deterministic routing — the model's scores are inputs, not decisions =====
    const tier = routeAction({
      action_type: a.action_type,
      confidence: a.confidence,
      blast_radius: a.blast_radius,
      reversible: a.reversible,
      feasible: a.action_type !== "other",
      thresholds,
    });

    const { data: row, error } = await db
      .from("proposed_actions")
      .insert({
        user_id: userId,
        source_id: source.id,
        action_type: a.action_type,
        title: a.title,
        description: a.description ?? null,
        params: a.params,
        source_quote: a.source_quote,
        confidence: a.confidence,
        blast_radius: a.blast_radius,
        reversible: a.reversible,
        tier,
        minutes_saved: minutesSavedFor(a.action_type as ActionType, minuteOverrides),
      })
      .select("id, tier")
      .single();
    if (error || !row) continue;
    created.push(row.id);

    await db.from("audit_log").insert({
      user_id: userId,
      proposed_action_id: row.id,
      event: "routed",
      actor: "system",
      detail: { tier, confidence: a.confidence, blast_radius: a.blast_radius },
    });

    // Auto tier fires immediately — internal, reversible, high confidence
    if (tier === "auto") {
      await executeAction(row.id, { approvedByOwner: false });
    }
  }

  await db.from("sources").update({ processed: true }).eq("id", source.id);
  return { created: created.length, summary: extraction.summary };
}
