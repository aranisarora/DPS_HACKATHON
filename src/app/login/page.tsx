"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { googleOAuthOptions } from "@/lib/google/oauth-options";
import { Orb } from "@/components/orb/orb";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
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
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Orb size={220} />
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-brass">
        The front desk
      </p>
      <h1 className="mt-3 font-display text-4xl font-medium tracking-tight">
        Meet <span className="italic text-brass-bright">Donna</span>
      </h1>
      <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-sage">
        One Google sign-in connects your calendar, inbox and tasks. Donna never
        acts without your approval.
      </p>
      <Button size="lg" className="mt-8" onClick={signIn} disabled={loading}>
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error && <p className="mt-4 text-sm text-pencil">{error}</p>}
      <p className="mt-6 max-w-xs text-center text-xs text-sage/80">
        By continuing you agree Donna may read your meetings and email to draft
        work for your approval.
      </p>
    </main>
  );
}
