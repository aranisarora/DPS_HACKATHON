import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { processSource } from "@/lib/pipeline";

/**
 * POST /api/ingest/recall — Recall.ai webhook.
 * Verifies the webhook signature, stores the raw payload as a source, then
 * runs extraction (lib/pipeline.ts) so proposals appear without any user
 * action.
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
    const event = payload?.event;
    if (event !== "bot.done" && payload?.data?.status?.code !== "done") {
      return NextResponse.json({ ok: true, ignored: event });
    }

    const botId: string = payload?.data?.bot_id ?? payload?.data?.bot?.id ?? "unknown";
    const db = createAdminClient();
    // Idempotent ingest via unique (user_id, kind, external_id).
    // Bot→user mapping is stored when the bot is scheduled (params.metadata).
    const userId = payload?.data?.metadata?.user_id;
    if (!userId) return NextResponse.json({ ok: true, note: "no user mapping" });

    const { data: source } = await db
      .from("sources")
      .upsert(
        {
          user_id: userId,
          kind: "meeting",
          title: payload?.data?.meeting_metadata?.title ?? "Meeting",
          raw: payload,
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
