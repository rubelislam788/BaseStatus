import { Activity, Database, KeyRound, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export default function AdminPage() {
  return (
    <main className="container py-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Protected operational view for API status, Guild sync, cache metrics, and logs.</p>
      </div>
      <div className="stat-grid">
        <StatCard label="Guild sync" value="6 hours" detail="Vercel Cron route" />
        <StatCard label="API mode" value="Server-only" detail="Secrets never exposed to browser" />
        <StatCard label="Database" value="Supabase" detail="RLS read-only public policies" />
        <StatCard label="Cache" value="Memory" detail="Redis-ready adapter boundary" />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {[
          { icon: RefreshCw, title: "Guild Sync Status", text: "POST /api/admin/sync-guilds with CRON_SECRET to refresh curated Guilds." },
          { icon: Activity, title: "API Status", text: "GET /api/admin/status reports configured providers and recent system logs." },
          { icon: Database, title: "Search Metrics", text: "Search history, wallet views, trending, and snapshots are persisted by service-role routes." },
          { icon: KeyRound, title: "Access Control", text: "Admin endpoints accept CRON_SECRET or an allowlisted admin email header." }
        ].map((item) => (
          <section key={item.title} className="card p-4">
            <item.icon className="text-[var(--primary)]" size={20} />
            <h2 className="mt-3 font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
