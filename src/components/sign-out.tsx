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
      className="ml-2 rounded-memo px-4 py-1.5 text-sm text-sage transition-colors hover:bg-paper/5 hover:text-paper"
    >
      Sign out
    </button>
  );
}
