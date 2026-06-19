import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  label,
  sublabel,
  className,
  size = 80,
}: {
  value: number;
  label: string;
  sublabel?: string;
  className?: string;
  size?: number;
}) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = c - (clamped / 100) * c;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(245,240,232,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#progress-ember)"
            strokeWidth={stroke}
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="progress-ember" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2d5a3f" />
              <stop offset="100%" stopColor="#e8a838" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-fraunces)] text-lg text-ember">
          {Math.round(clamped)}%
        </span>
      </div>
      <span className="text-xs text-cream/55 text-center leading-tight">{label}</span>
      {sublabel && (
        <span className="text-[10px] text-cream/35 text-center">{sublabel}</span>
      )}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="stat-card p-3 sm:p-4 relative overflow-hidden">
      {Icon && (
        <Icon className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-4 h-4 text-cream/15" />
      )}
      <p className="text-[9px] sm:text-[10px] text-cream/45 uppercase tracking-[0.12em] sm:tracking-[0.15em] pr-6">{label}</p>
      <p
        className={cn(
          "text-lg sm:text-xl md:text-2xl font-[family-name:var(--font-fraunces)] mt-1 leading-tight break-words",
          accent && "text-ember"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-cream/40 mt-1">{sub}</p>}
    </Card>
  );
}
