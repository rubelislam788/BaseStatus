import { cn } from "@/lib/utils";

export function StatCard({ label, value, detail, className }: { label: string; value: string | number; detail?: string; className?: string }) {
  return (
    <div className={cn("card p-4", className)}>
      <div className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {detail ? <div className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</div> : null}
    </div>
  );
}
