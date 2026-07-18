import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/adapters";
import { Dashboard, type GoogleStatus } from "@/components/dashboard/dashboard";
import type { ProposedAction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();

  // google_connections is service-role only — read via the admin client.
  let googleStatus: GoogleStatus = "none";
  if (user) {
    const { data: conn } = await createAdminClient()
      .from("google_connections")
      .select("status")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();
    googleStatus =
      conn?.status === "connected" ? "connected" : conn ? "revoked" : "none";
  }

  const [{ data: pending }, { data: recent }, { data: executedWeek }] = await Promise.all([
    supabase
      .from("proposed_actions")
      .select("*")
      .eq("status", "proposed")
      .order("created_at", { ascending: false }),
    supabase
      .from("proposed_actions")
      .select("*")
      .in("status", ["executed", "skipped", "failed"])
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase
      .from("proposed_actions")
      .select("minutes_saved")
      .eq("status", "executed")
      .gte("executed_at", weekAgo),
  ]);

  const weeklyMinutes = (executedWeek ?? []).reduce((sum, a) => sum + (a.minutes_saved ?? 0), 0);

  return (
    <Dashboard
      userEmail={user?.email ?? ""}
      initialPending={(pending ?? []) as ProposedAction[]}
      initialRecent={(recent ?? []) as ProposedAction[]}
      initialWeeklyMinutes={weeklyMinutes}
      googleStatus={googleStatus}
      googleLive={!isDemoMode("google")}
    />
  );
}
