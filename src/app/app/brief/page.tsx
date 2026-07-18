import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";
import { formatMinutes } from "@/lib/minutes";
import type { ProposedAction, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BriefPage() {
  const supabase = await createClient();
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: doneToday }, { data: needsOk }, { data: overdue }, { data: willDo }, { data: weekMins }] =
    await Promise.all([
      supabase
        .from("proposed_actions")
        .select("*")
        .eq("status", "executed")
        .gte("executed_at", dayStart.toISOString())
        .order("executed_at", { ascending: false }),
      supabase
        .from("proposed_actions")
        .select("*")
        .eq("status", "proposed")
        .in("tier", ["approve", "suggest"])
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("*")
        .in("status", ["open", "in_progress"])
        .lt("due_date", today)
        .order("due_date"),
      supabase
        .from("proposed_actions")
        .select("*")
        .eq("status", "proposed")
        .eq("tier", "auto")
        .order("created_at", { ascending: false }),
      supabase
        .from("proposed_actions")
        .select("minutes_saved")
        .eq("status", "executed")
        .gte("executed_at", weekAgo),
    ]);

  const todayMinutes = (doneToday ?? []).reduce((s, a) => s + (a.minutes_saved ?? 0), 0);
  const weeklyMinutes = (weekMins ?? []).reduce((s, a) => s + (a.minutes_saved ?? 0), 0);

  const sections: Array<{
    title: string;
    hint: string;
    urgent?: boolean;
    items: Array<{ id: string; title: string; sub?: string; mins?: number }>;
    empty: string;
  }> = [
    {
      title: "Did these",
      hint: "Executed today",
      items: (doneToday as ProposedAction[] | null ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        mins: a.minutes_saved,
      })),
      empty: "Nothing executed yet today.",
    },
    {
      title: "Need your OK",
      hint: "Waiting in the inbox",
      items: (needsOk as ProposedAction[] | null ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        sub: a.source_quote ?? undefined,
      })),
      empty: "Inbox is clear.",
    },
    {
      title: "Overdue",
      hint: "Assigned tasks past due",
      urgent: true,
      items: (overdue as Task[] | null ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        sub: t.assignee_name ? `${t.assignee_name} · due ${t.due_date}` : `due ${t.due_date}`,
      })),
      empty: "Nothing overdue. Nice.",
    },
    {
      title: "Will do unless you stop me",
      hint: "Auto-tier, firing shortly",
      items: (willDo as ProposedAction[] | null ?? []).map((a) => ({
        id: a.id,
        title: a.title,
      })),
      empty: "No autonomous actions queued.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-brass">
            The morning memo
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Daily brief</h1>
          <p className="mt-1 text-sm text-sage">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sage">Saved today</p>
          <p className="font-mono text-2xl text-brass-bright">
            {formatMinutes(todayMinutes)}
          </p>
          <p className="font-mono text-xs text-sage/80">{formatMinutes(weeklyMinutes)} this week</p>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <Card key={s.title} className="p-6">
            <div className="mb-3 flex items-baseline justify-between">
              <h2
                className={`font-display text-xl font-medium ${
                  s.urgent && s.items.length > 0 ? "text-pencil" : ""
                }`}
              >
                {s.title}
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                {s.hint}
              </span>
            </div>
            {s.items.length === 0 ? (
              <p className="text-sm italic text-ink-soft">{s.empty}</p>
            ) : (
              <ul className="divide-y divide-paper-line">
                {s.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{item.title}</p>
                      {item.sub && (
                        <p className="truncate font-display text-xs italic text-ink-soft">
                          “{item.sub}”
                        </p>
                      )}
                    </div>
                    {item.mins != null && (
                      <Chip className="shrink-0 text-brass-deep">+{item.mins} min</Chip>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
