import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink/[0.07] bg-white shadow-[0_1px_3px_rgba(22,22,26,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}
