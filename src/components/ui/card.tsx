import { cn } from "@/lib/utils";

/** A memo — ivory paper resting on the desk. */
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
        "paper-surface rounded-memo text-ink shadow-memo",
        className
      )}
    >
      {children}
    </div>
  );
}
