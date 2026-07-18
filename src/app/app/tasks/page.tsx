import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

/* Status marks, set like ledger annotations */
const STATUS_STYLES: Record<string, string> = {
  open: "text-brass-deep",
  in_progress: "text-ink",
  done: "text-ink-soft line-through",
  cancelled: "text-ink-soft/60",
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
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-brass">The docket</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Tasks</h1>
      <p className="mt-1 text-sm text-sage">
        Extracted from meetings and email. Donna&apos;s database is the source of
        truth — assignees are notified by email or Slack.
      </p>

      <Card className="mt-6 divide-y divide-paper-line">
        {list.length === 0 && (
          <p className="p-8 text-center text-sm italic text-ink-soft">
            No tasks yet. They appear when Donna extracts action items.
          </p>
        )}
        {list.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              <p className="mt-0.5 font-mono text-[11px] tracking-wide text-ink-soft">
                {t.assignee_name ?? "Unassigned"}
                {t.due_date && ` · due ${t.due_date}`}
              </p>
              {t.source_quote && (
                <p className="mt-1 truncate font-display text-xs italic text-ink-soft">
                  “{t.source_quote}”
                </p>
              )}
            </div>
            <span
              className={`shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] ${STATUS_STYLES[t.status]}`}
            >
              {t.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </Card>
    </div>
  );
}
