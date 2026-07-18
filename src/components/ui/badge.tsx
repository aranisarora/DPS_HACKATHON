import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/types";

/* Tier marks are rubber stamps — the office's actual vocabulary. */
const tierStyles: Record<Tier, string> = {
  auto: "text-brass-deep",
  approve: "text-ink",
  suggest: "text-pencil",
};

const tierLabels: Record<Tier, string> = {
  auto: "Runs itself",
  approve: "Needs your OK",
  suggest: "For your eyes",
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return <span className={cn("stamp", tierStyles[tier], className)}>{tierLabels[tier]}</span>;
}

/** Ledger figure — minutes credited, set in mono like a bookkeeping entry. */
export function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-mono text-[11px] tracking-wider text-ink-soft",
        className
      )}
    >
      {children}
    </span>
  );
}
