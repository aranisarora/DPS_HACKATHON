"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * An image slot that degrades gracefully: renders its styled fallback until
 * the file exists and loads, then cross-fades the image in. Lets generated
 * artwork be dropped into /public/images later without breaking the page.
 */
export function Artwork({
  src,
  alt,
  className,
  imgClassName,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback?: React.ReactNode;
}) {
  const [state, setState] = useState<"loading" | "loaded" | "missing">("loading");

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {state !== "loaded" && fallback}
      {state !== "missing" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setState("loaded")}
          onError={() => setState("missing")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-700",
            state === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName
          )}
        />
      )}
    </div>
  );
}
