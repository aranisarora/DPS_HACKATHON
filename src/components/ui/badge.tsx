import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/types";

const tierStyles: Record<Tier, string> = {
  auto: "bg-accent-teal/10 text-teal-700 border-accent-teal/30",
  approve: "bg-accent-soft text-accent border-accent/25",
  suggest: "bg-amber-50 text-amber-700 border-amber-200",
};

const tierLabels: Record<Tier, string> = {
  auto: "Done automatically",
  approve: "Needs your OK",
  suggest: "Suggestion",
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tierStyles[tier],
        className
      )}
    >
      {tierLabels[tier]}
    </span>
  );
}

export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-medium text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
