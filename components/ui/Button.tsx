import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-ember text-night font-semibold hover:bg-ember-glow ember-glow disabled:opacity-50",
      secondary:
        "bg-forest-light/60 text-cream border border-glass-border hover:bg-forest-light",
      ghost: "text-cream/80 hover:text-cream hover:bg-white/5",
      danger: "bg-red-900/60 text-red-200 border border-red-800 hover:bg-red-900",
    };
    const sizes = {
      sm: "min-h-10 px-3 py-2 text-sm rounded-lg touch-manipulation",
      md: "min-h-11 px-4 py-2.5 text-sm rounded-xl touch-manipulation",
      lg: "min-h-12 px-6 py-3 text-base rounded-xl touch-manipulation",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
