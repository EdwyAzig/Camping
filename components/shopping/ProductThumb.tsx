"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "w-11 h-11",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  hero: "w-full h-36",
} as const;

export function ProductThumb({
  src,
  alt,
  size = "sm",
  className,
}: {
  src?: string | null;
  alt: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const isHero = size === "hero";

  if (!src || failed) {
    return (
      <div
        className={cn(
          "rounded-xl bg-white/5 border border-glass-border flex items-center justify-center shrink-0",
          isHero ? "w-full h-36" : sizes[size],
          className
        )}
      >
        <Package className={cn("text-cream/20", isHero ? "w-10 h-10" : "w-5 h-5")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden border border-white/10",
        isHero ? "w-full h-36" : sizes[size],
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          "object-contain",
          isHero ? "max-h-[85%] max-w-[85%]" : "max-w-[88%] max-h-[88%]"
        )}
      />
    </div>
  );
}
