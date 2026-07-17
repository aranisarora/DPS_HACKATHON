import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processSource } from "@/lib/pipeline";

/**
 * POST /api/process { source_id } — browser-facing wrapper around the
 * pipeline (lib/pipeline.ts). Server-side callers (Recall webhook, Gmail
 * sync) invoke processSource directly.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { source_id } = await req.json();
    if (typeof source_id !== "string") {
      return NextResponse.json({ error: "source_id required" }, { status: 400 });
    }

    const result = await processSource(user.id, source_id);
    return NextResponse.json({ ok: true, created: result.created, summary: result.summary });
  } catch (err) {
    console.error(err);
    const message = String(err);
    if (message.includes("Source not found")) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
