import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("settings, email, company_domain")
    .eq("id", user!.id)
    .single();

  // google_connections is service-role only (no RLS policies by design)
  const { data: googleConn } = await createAdminClient()
    .from("google_connections")
    .select("status, last_synced_at")
    .eq("user_id", user!.id)
    .eq("provider", "google")
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-brass">House rules</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-sage">
        Autonomy thresholds and time-saved estimates. Honest defaults — tune them to your reality.
      </p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-medium">Connected account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {profile?.email} · workspace domain{" "}
          <span className="font-medium text-ink">{profile?.company_domain}</span>
        </p>
        <p className="mt-2 text-sm">
          {googleConn?.status === "connected" ? (
            <span className="text-brass-deep">
              Google connected — email &amp; calendar actions run live
              {googleConn.last_synced_at
                ? ` · last sync ${new Date(googleConn.last_synced_at).toLocaleString()}`
                : ""}
            </span>
          ) : (
            <span className="text-pencil">
              Google not connected — actions run in simulation. Sign out and back
              in to grant access.
            </span>
          )}
        </p>
      </Card>

      <SettingsForm initialSettings={profile?.settings ?? {}} />
    </div>
  );
}
