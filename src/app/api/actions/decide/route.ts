import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DecisionSchema } from "@/lib/schemas";
import { executeAction } from "@/lib/executor";

/**
 * POST /api/actions/decide — the owner's tap.
 * approve → mark approved → fire through the executor
 * edit    → merge edited params → mark edited → fire
 * skip    → mark skipped (orb dims briefly)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = DecisionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { action_id, decision, edited_params } = parsed.data;

    const db = createAdminClient();
    // Ownership check (service role bypasses RLS, so verify explicitly)
    const { data: action } = await db
      .from("proposed_actions")
      .select("id, user_id, status, params, minutes_saved")
      .eq("id", action_id)
      .single();
    if (!action || action.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!["proposed"].includes(action.status)) {
      return NextResponse.json({ error: `Action is already ${action.status}` }, { status: 409 });
    }

    if (decision === "skip") {
      await db.from("proposed_actions").update({ status: "skipped" }).eq("id", action_id);
      await db.from("audit_log").insert({
        user_id: user.id,
        proposed_action_id: action_id,
        event: "skipped",
        actor: "owner",
      });
      return NextResponse.json({ ok: true, status: "skipped" });
    }

    const newStatus = decision === "edit" ? "edited" : "approved";
    await db
      .from("proposed_actions")
      .update({
        status: newStatus,
        ...(edited_params
          ? { params: { ...(action.params as object), ...edited_params } }
          : {}),
      })
      .eq("id", action_id);
    await db.from("audit_log").insert({
      user_id: user.id,
      proposed_action_id: action_id,
      event: newStatus,
      actor: "owner",
    });

    const result = await executeAction(action_id, { approvedByOwner: true });
    return NextResponse.json({
      ok: result.ok,
      status: result.ok ? "executed" : "failed",
      minutes_saved: result.ok ? action.minutes_saved : 0,
      demo: result.result?.demo ?? false,
      error: result.error,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
