import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, withRetry } from "@/lib/adapters";

/**
 * POST /api/bots/schedule — send a Donna notetaker bot to a meeting URL.
 * Creates a Recall.ai bot with metadata.user_id so the webhook
 * (/api/ingest/recall) can map the finished transcript back to this user.
 */

// Hosts Recall can actually join — friendlier than letting Recall 400 on junk.
const MEETING_HOSTS = [
  "zoom.us",
  "meet.google.com",
  "teams.microsoft.com",
  "teams.live.com",
  "webex.com",
];

const bodySchema = z.object({
  meeting_url: z
    .string()
    .trim()
    .url("Enter a valid meeting link")
    .refine((raw) => {
      try {
        const host = new URL(raw).hostname;
        return MEETING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
      } catch {
        return false;
      }
    }, "Use a Zoom, Google Meet, Teams or Webex link"),
});

// Recall API keys are region-scoped; the base URL must match the dashboard region.
const RECALL_BASE = `https://${process.env.RECALL_REGION ?? "us-west-2"}.recall.ai/api/v1`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid meeting URL" },
        { status: 400 }
      );
    }

    if (isDemoMode("recall")) {
      return NextResponse.json({
        ok: true,
        demo: true,
        detail: "Recall not configured — see SETUP.md §4 for live meeting capture.",
      });
    }

    const res = await withRetry(() =>
      fetch(`${RECALL_BASE}/bot/`, {
        method: "POST",
        headers: {
          authorization: `Token ${process.env.RECALL_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          meeting_url: parsed.data.meeting_url,
          bot_name: "Donna",
          // The webhook reads this back to attribute the transcript
          metadata: { user_id: user.id },
          recording_config: {
            transcript: { provider: { meeting_captions: {} } },
          },
        }),
      })
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`recall bot create failed (${res.status}):`, detail);
      return NextResponse.json(
        { ok: false, error: "Recall couldn't join that meeting — check the link and try again." },
        { status: 502 }
      );
    }

    const bot = await res.json();
    return NextResponse.json({ ok: true, bot_id: bot.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
