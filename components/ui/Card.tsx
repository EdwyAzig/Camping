import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
}

export function Card({
  className,
  children,
  hover = false,
  glow = false,
  gradient = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "glass-card p-4 sm:p-5",
        hover && "glass-card-hover cursor-pointer",
        glow && "glass-card-glow",
        gradient && "gradient-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      className={cn(
        "font-[family-name:var(--font-fraunces)] text-xl text-cream mb-1",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-cream/60 text-sm", className)}>{children}</p>;
}
