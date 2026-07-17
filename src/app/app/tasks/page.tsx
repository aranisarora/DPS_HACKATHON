import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  open: "bg-accent-soft text-accent",
  in_progress: "bg-blue-50 text-blue-700",
  done: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-ink/5 text-ink-soft",
};

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .order("due_date", { ascending: true, nullsFirst: false });

  const list = (tasks ?? []) as Task[];

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Tasks</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Extracted from meetings and email. Donna&apos;s database is the source of
        truth — assignees are notified by email or Slack.
      </p>

      <Card className="mt-6 divide-y divide-ink/[0.06]">
        {list.length === 0 && (
          <p className="p-8 text-center text-sm text-ink-soft">
            No tasks yet. They appear when Donna extracts action items.
          </p>
        )}
        {list.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {t.assignee_name ?? "Unassigned"}
                {t.due_date && ` · due ${t.due_date}`}
              </p>
              {t.source_quote && (
                <p className="mt-1 truncate text-xs italic text-ink-soft">“{t.source_quote}”</p>
              )}
            </div>
            <Chip className={STATUS_STYLES[t.status]}>{t.status.replace("_", " ")}</Chip>
          </div>
        ))}
      </Card>
    </div>
  );
}
