import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const boards = ["Top Wallets", "Most Active", "Most Roles", "Fastest Growth"];

export default function LeaderboardsPage() {
  return (
    <main className="container py-8">
      <div className="mb-5 flex items-center gap-3">
        <Trophy className="text-[var(--accent)]" />
        <div>
          <h1 className="text-2xl font-semibold">Leaderboards</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Rankings are generated from saved wallet snapshots and scores.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {boards.map((board) => (
          <section key={board} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="min-w-0 truncate font-semibold">{board}</h2>
              <Badge>Live-ready</Badge>
            </div>
            <div className="mt-4 rounded-[8px] border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-foreground)]">
              Rankings appear after wallet profiles are analyzed and persisted in Supabase.
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
