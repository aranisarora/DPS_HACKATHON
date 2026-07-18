"use client";

import dynamic from "next/dynamic";
import type { OrbMood } from "./orb-scene";

/** CSS fallback while the 3D bundle loads (and for reduced-motion users). */
function OrbFallback({ size = 280 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="rounded-full animate-breathe"
      style={{
        width: size * 0.62,
        height: size * 0.62,
        margin: size * 0.19,
        background:
          "radial-gradient(circle at 36% 30%, #e6c87f 0%, #c2a25b 42%, #8a6f35 78%, #5e4a20 100%)",
        boxShadow: "0 0 60px rgba(230,200,127,0.25)",
      }}
    />
  );
}

// Lazy-load the 3D scene: never costs the initial bundle or Lighthouse score
const OrbScene = dynamic(() => import("./orb-scene"), {
  ssr: false,
  loading: () => <OrbFallback />,
});

export function Orb({ mood = "idle", size = 280 }: { mood?: OrbMood; size?: number }) {
  return <OrbScene mood={mood} size={size} />;
}

export type { OrbMood };
