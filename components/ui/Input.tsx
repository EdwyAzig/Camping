import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl bg-night/50 border border-glass-border px-4 py-2.5 text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-ember/50 focus:border-ember/50 transition-all",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl bg-night/50 border border-glass-border px-4 py-2.5 text-cream placeholder:text-cream/40 focus:outline-none focus:ring-2 focus:ring-ember/50 focus:border-ember/50 transition-all resize-y min-h-[80px]",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl bg-night/50 border border-glass-border px-4 py-2.5 text-cream focus:outline-none focus:ring-2 focus:ring-ember/50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block text-sm text-cream/70 mb-1.5", className)}>
      {children}
    </label>
  );
}
