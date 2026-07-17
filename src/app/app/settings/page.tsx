import { createClient } from "@/lib/supabase/server";
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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-medium tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Autonomy thresholds and time-saved estimates. Honest defaults — tune them to your reality.
      </p>

      <Card className="mt-6 p-6">
        <h2 className="font-display text-lg font-medium">Connected account</h2>
        <p className="mt-2 text-sm text-ink-soft">
          {profile?.email} · workspace domain{" "}
          <span className="font-medium text-ink">{profile?.company_domain}</span>
        </p>
      </Card>

      <SettingsForm initialSettings={profile?.settings ?? {}} />
    </div>
  );
}
