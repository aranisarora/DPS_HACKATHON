"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { googleOAuthOptions } from "@/lib/google/oauth-options";
import { Button } from "@/components/ui/button";

/**
 * "Reconnect Google" — re-runs the same OAuth flow as the login page
 * (offline access + full scopes) to restore a missing/revoked connection.
 */
export function ReconnectGoogle({
  size = "sm",
  label = "Reconnect Google",
}: {
  size?: "sm" | "lg";
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reconnect() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: googleOAuthOptions(window.location.origin),
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button size={size} onClick={reconnect} disabled={loading}>
        {loading ? "Redirecting…" : label}
      </Button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </span>
  );
}
