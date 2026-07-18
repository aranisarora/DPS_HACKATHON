import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* Styled for paper by default; on the dark desk, pass text/border overrides
   via className (tailwind-merge resolves the conflict). */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-memo text-sm font-medium tracking-wide transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60",
  {
    variants: {
      variant: {
        // Brass plate — the one action that matters on any surface
        primary:
          "bg-brass text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(0,0,0,0.3)] hover:bg-brass-bright",
        outline:
          "border border-ink/25 text-ink hover:border-brass-deep hover:text-brass-deep",
        ghost: "text-ink-soft hover:text-ink hover:bg-ink/5",
        // Ink block — dark emphasis on paper
        dark: "bg-ink text-paper hover:bg-ink/85",
      },
      size: {
        sm: "h-8 px-4 text-xs",
        md: "h-10 px-5",
        lg: "h-12 px-7 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
