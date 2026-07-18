import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { processSource } from "@/lib/pipeline";
import { fetchRecallTranscript } from "@/lib/recall";

/**
 * POST /api/ingest/recall — Recall.ai webhook.
 * Verifies the webhook signature, fetches the finished transcript, stores it
 * as a source, then runs extraction (lib/pipeline.ts) so proposals appear
 * without any user action.
 *
 * Recall fires `transcript.done` when the transcript is ready to query. That
 * event carries only the transcript *id* — the words are fetched separately
 * (lib/recall.ts). Payload shape:
 *   { event: "transcript.done",
 *     data: { bot: { id, metadata: { user_id } },
 *             data: { code: "done" },
 *             transcript: { id } } }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Webhook signature verification (Recall signs callbacks — svix format).
    // Fail closed in production: an unsigned endpoint would let anyone inject
    // fake transcripts into a user's pipeline.
    const secret = process.env.RECALL_WEBHOOK_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
    }
    if (secret) {
      const sig = req.headers.get("svix-signature") ?? "";
      const id = req.headers.get("svix-id") ?? "";
      const ts = req.headers.get("svix-timestamp") ?? "";
      const secretBytes = Buffer.from(secret.split("_")[1] ?? secret, "base64");
      const expected = createHmac("sha256", secretBytes)
        .update(`${id}.${ts}.${body}`)
        .digest("base64");
      const provided = sig.split(" ").map((s) => s.split(",")[1] ?? s);
      const valid = provided.some((p) => {
        try {
          return timingSafeEqual(Buffer.from(expected), Buffer.from(p));
        } catch {
          return false;
        }
      });
      if (!valid) return NextResponse.json({ error: "Bad signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const event: string = payload?.event ?? "";
    // Status lives at data.data.code on artifact events; older bot events use
    // data.status.code. Accept either.
    const statusCode = payload?.data?.data?.code ?? payload?.data?.status?.code;
    const transcriptId: string | undefined = payload?.data?.transcript?.id;

    // We only act on a *ready* transcript. transcript.done is the trigger;
    // bot.done fires earlier (before the transcript exists) so we skip it.
    const isDone = event === "transcript.done" || statusCode === "done";
    if (!isDone || !transcriptId) {
      return NextResponse.json({ ok: true, ignored: event || "unknown" });
    }

    // Bot→user mapping is set when the bot is scheduled (metadata.user_id).
    // Recall nests it under data.bot.metadata; keep the flat path as a fallback.
    const userId: string | undefined =
      payload?.data?.bot?.metadata?.user_id ?? payload?.data?.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true, note: "no user mapping" });

    const botId: string = payload?.data?.bot?.id ?? payload?.data?.bot_id ?? transcriptId;

    // Fetch the actual transcript text — the webhook carries only its id.
    const transcript = await fetchRecallTranscript(transcriptId);
    if (!transcript || !transcript.text) {
      // Transcript not retrievable yet (or empty) — store nothing and let
      // Recall retry the webhook, or POST /api/process once it's ready.
      console.error(`recall transcript ${transcriptId} not retrievable yet`);
      return NextResponse.json({ ok: true, processed: false, note: "transcript pending" });
    }

    const db = createAdminClient();
    // Idempotent ingest via unique (user_id, kind, external_id).
    const { data: source } = await db
      .from("sources")
      .upsert(
        {
          user_id: userId,
          kind: "meeting",
          title: payload?.data?.bot?.meeting_metadata?.title ?? "Meeting",
          // Store the flattened transcript as plain text — the extraction
          // model reads prose, not the webhook envelope.
          raw: transcript.text,
          participants: transcript.participants,
          external_id: botId,
          processed: false,
        },
        { onConflict: "user_id,kind,external_id" }
      )
      .select("id, processed")
      .single();

    // Run extraction now — nothing else picks up unprocessed sources.
    if (source && !source.processed) {
      try {
        await processSource(userId, source.id);
      } catch (err) {
        // Source is stored; extraction can be retried via POST /api/process
        console.error("recall pipeline failed:", err);
        return NextResponse.json({ ok: true, processed: false });
      }
    }

    return NextResponse.json({ ok: true, processed: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
