import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateTaskSchema, UpdateTaskSchema } from "@/lib/schemas";

/**
 * POST  /api/tasks — quick-add a task by hand (no LLM involved).
 * PATCH /api/tasks — toggle a task open/done.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = CreateTaskSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { title, detail, assignee_name, due_date } = parsed.data;

    const db = createAdminClient();
    const { data: task, error } = await db
      .from("tasks")
      .insert({
        user_id: user.id,
        title,
        detail: detail ?? null,
        assignee_name: assignee_name ?? null,
        due_date: due_date ?? null,
        status: "open",
      })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, task_id: task.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = UpdateTaskSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { task_id, status } = parsed.data;

    const db = createAdminClient();
    // Ownership check (service role bypasses RLS, so verify explicitly)
    const { data: task } = await db
      .from("tasks")
      .select("id, user_id")
      .eq("id", task_id)
      .single();
    if (!task || task.user_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { error } = await db.from("tasks").update({ status }).eq("id", task_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, status });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
