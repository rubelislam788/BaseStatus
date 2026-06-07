import { cn } from "@/lib/utils";

export function ScoreRing({ value, label, className }: { value: number; label: string; className?: string }) {
  const color = value >= 80 ? "var(--success)" : value >= 60 ? "var(--accent)" : "var(--destructive)";
  const normalized = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative grid size-16 place-items-center text-lg font-semibold">
        <svg className="absolute inset-0 size-16 -rotate-90" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="28" fill="none" stroke="var(--muted)" strokeWidth="6" />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <span>{normalized}</span>
      </div>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-[var(--muted-foreground)]">0-100 score</div>
      </div>
    </div>
  );
}
