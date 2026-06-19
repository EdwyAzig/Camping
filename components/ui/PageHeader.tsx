import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  badge,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("page-header animate-fade-up", className)}>
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="icon-glow shrink-0">
            <Icon className="w-6 h-6 text-ember" />
          </div>
        )}
        <div className="min-w-0">
          {badge && (
            <span className="inline-block text-[10px] uppercase tracking-[0.2em] text-ember/80 font-medium mb-1.5">
              {badge}
            </span>
          )}
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl sm:text-2xl md:text-3xl text-cream leading-tight break-words">
            {title}
          </h2>
          {description && (
            <p className="text-cream/55 text-sm mt-1.5 max-w-xl">{description}</p>
          )}
        </div>
      </div>
      <div className="header-accent" />
    </header>
  );
}
