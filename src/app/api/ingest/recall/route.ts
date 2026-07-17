import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/ingest/recall — Recall.ai webhook.
 * Verifies the webhook signature, stores the raw payload as a source.
 * Transcript download + extraction runs via /api/process (kept separate so
 * webhook responds fast).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // Webhook signature verification (Recall signs callbacks — svix format)
    const secret = process.env.RECALL_WEBHOOK_SECRET;
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

    await db.from("sources").upsert(
      {
        user_id: userId,
        kind: "meeting",
        title: payload?.data?.meeting_metadata?.title ?? "Meeting",
        raw: payload,
        external_id: botId,
        processed: false,
      },
      { onConflict: "user_id,kind,external_id" }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
