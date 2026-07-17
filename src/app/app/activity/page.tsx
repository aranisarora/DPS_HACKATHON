import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const EVENT_LABELS: Record<string, string> = {
  routed: "Routed",
  approved: "Approved by you",
  edited: "Edited & approved",
  skipped: "Skipped",
  fired: "Executed",
  failed: "Failed",
  blocked: "Blocked by fire gate",
};

export default async function ActivityPage() {
  const supabase = await createClient();

  const [{ data: sources }, { data: audit }] = await Promise.all([
    supabase
      .from("sources")
      .select("id, kind, title, occurred_at, participants, processed")
      .order("occurred_at", { ascending: false })
      .limit(10),
    supabase
      .from("audit_log")
      .select("id, event, actor, detail, created_at, proposed_actions(title, action_type)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Activity</h1>
      <p className="mt-1 text-sm text-ink-soft">
        The audit trail — every source Donna read and every decision made.
      </p>

      <h2 className="mt-8 mb-3 font-display text-xl font-medium">Sources</h2>
      <Card className="divide-y divide-ink/[0.06]">
        {(sources ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-ink-soft">No meetings or emails yet.</p>
        )}
        {(sources ?? []).map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-ink-soft">
                {s.kind} ·{" "}
                {new Date(s.occurred_at).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {Array.isArray(s.participants) && s.participants.length > 0 &&
                  ` · ${(s.participants as Array<{ name: string }>).map((p) => p.name).join(", ")}`}
              </p>
            </div>
            <Chip>{s.processed ? "processed" : "pending"}</Chip>
          </div>
        ))}
      </Card>

      <h2 className="mt-10 mb-3 font-display text-xl font-medium">Audit log</h2>
      <Card className="divide-y divide-ink/[0.06]">
        {(audit ?? []).length === 0 && (
          <p className="p-6 text-center text-sm text-ink-soft">No events yet.</p>
        )}
        {(audit ?? []).map((e) => {
          const pa = e.proposed_actions as unknown as { title?: string } | null;
          return (
            <div key={e.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  <span className="font-medium">{EVENT_LABELS[e.event] ?? e.event}</span>
                  {pa?.title && <span className="text-ink-soft"> — {pa.title}</span>}
                </p>
                <p className="text-xs text-ink-soft">
                  {e.actor} ·{" "}
                  {new Date(e.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {(e.detail as Record<string, unknown>)?.demo === true && <Chip>demo</Chip>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
