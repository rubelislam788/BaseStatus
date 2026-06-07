import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TrendingPage() {
  return (
    <main className="container py-8">
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <Flame className="text-[var(--destructive)]" />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">Trending Wallets</h1>
            <p className="text-sm text-[var(--muted-foreground)]">Most searched, most viewed, and fastest growing profiles.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge>Most viewed</Badge>
          <Badge>Most searched</Badge>
          <Badge>Fastest growing</Badge>
        </div>
        <div className="mt-5 rounded-[8px] border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted-foreground)]">
          Trending data is populated from search history, wallet views, and snapshot growth once Supabase is configured.
        </div>
      </div>
    </main>
  );
}
