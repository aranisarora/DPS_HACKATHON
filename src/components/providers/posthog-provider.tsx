"use client";

import { useEffect, type ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function PHProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key && !posthog.__loaded) {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>;
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

/** Which actions get approved vs skipped = product gold. */
export function captureDecision(
  decision: "approve" | "edit" | "skip",
  actionType: string,
  minutesSaved: number
) {
  if (!posthog.__loaded) return;
  posthog.capture(`action_${decision}`, {
    action_type: actionType,
    minutes_saved: minutesSaved,
  });
}
