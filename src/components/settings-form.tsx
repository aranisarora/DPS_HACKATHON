"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const MINUTE_LABELS: Record<string, string> = {
  recap_email: "Recap email drafted & sent",
  follow_up_booking: "Follow-up meeting booked",
  task_assignment: "Task extracted & assigned",
  absentee_update: "Absentee update written",
  slack_summary: "Slack summary posted",
  email_reply: "Inbound email reply drafted",
  daily_brief: "Daily brief compiled",
};

type Settings = {
  minutes_saved?: Record<string, number>;
  autonomy?: { auto_confidence_min?: number; draft_confidence_min?: number };
};

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [minutes, setMinutes] = useState<Record<string, number>>(
    initialSettings.minutes_saved ?? {}
  );
  const [autoMin, setAutoMin] = useState(
    initialSettings.autonomy?.auto_confidence_min ?? 0.85
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({
          settings: {
            ...initialSettings,
            minutes_saved: minutes,
            autonomy: { ...initialSettings.autonomy, auto_confidence_min: autoMin },
          },
        })
        .eq("id", user.id);
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <>
      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-medium">Time-saved estimates</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Minutes credited per executed action. Framed as estimates, never inflated.
        </p>
        <div className="mt-4 space-y-3">
          {Object.entries(MINUTE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-sm">{label}</label>
              <input
                type="number"
                min={0}
                max={120}
                value={minutes[key] ?? ""}
                placeholder="default"
                onChange={(e) =>
                  setMinutes((m) => ({ ...m, [key]: Number(e.target.value) }))
                }
                className="w-20 rounded-lg border border-ink/15 px-3 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-medium">Autonomy</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Minimum confidence before Donna acts alone on internal, reversible
          actions. External sends always need your tap — that&apos;s not configurable, by design.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <input
            type="range"
            min={0.6}
            max={0.99}
            step={0.01}
            value={autoMin}
            onChange={(e) => setAutoMin(Number(e.target.value))}
            className="w-full accent-[#7c6aea]"
          />
          <span className="w-14 text-right font-mono text-sm">{Math.round(autoMin * 100)}%</span>
        </div>
      </Card>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
        {saved && <span className="text-sm text-emerald-600">Saved.</span>}
      </div>
    </>
  );
}
