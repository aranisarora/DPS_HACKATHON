import { cn } from "@/lib/utils";

/** A rubber stamp mark. `slam` renders the big animated version that
 *  thuds onto a memo when a decision lands. */
export function Stamp({
  children,
  color = "brass",
  slam = false,
  className,
}: {
  children: React.ReactNode;
  color?: "brass" | "pencil" | "ink";
  slam?: boolean;
  className?: string;
}) {
  const colors = {
    brass: "text-brass-deep",
    pencil: "text-pencil",
    ink: "text-ink",
  } as const;

  return (
    <span
      className={cn(
        "stamp",
        slam ? "stamp-slam animate-stamp" : "stamp-tilt",
        colors[color],
        className
      )}
    >
      {children}
    </span>
  );
}
