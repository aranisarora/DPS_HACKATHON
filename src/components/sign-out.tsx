"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
      }}
      className="ml-2 rounded-full px-4 py-1.5 text-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
    >
      Sign out
    </button>
  );
}
