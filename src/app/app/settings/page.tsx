import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings-form";
import { ReconnectGoogle } from "@/components/reconnect-google";

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
        {googleConn?.status === "connected" ? (
          <p className="mt-2 text-sm">
            <span className="text-brass-deep">
              Google connected — email &amp; calendar actions run live
              {googleConn.last_synced_at
                ? ` · last sync ${new Date(googleConn.last_synced_at).toLocaleString()}`
                : ""}
            </span>
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-pencil">
              {googleConn?.status === "revoked"
                ? "Google access was revoked — approved actions will fail until you reconnect."
                : "Google not connected — approved actions will fail until you connect."}
            </span>
            <ReconnectGoogle />
          </div>
        )}
      </Card>

      <SettingsForm initialSettings={profile?.settings ?? {}} />
    </div>
  );
}
