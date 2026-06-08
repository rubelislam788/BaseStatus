import { Activity, BadgeCheck, ShieldCheck, Trophy } from "lucide-react";
import { WalletSearch } from "@/components/wallet-search";
import { StatCard } from "@/components/stat-card";

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="container py-8 sm:py-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">Read-only Base wallet intelligence</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">Wallet Intelligence</h1>
            <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
              Analyze wallet activity, NFTs, token balances, identity, security posture, Guild role eligibility, rankings, growth, and next best actions without connecting a wallet.
            </p>
          </div>
          <div className="mt-7 max-w-4xl">
            <WalletSearch />
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="stat-grid">
          <StatCard label="Mode" value="Read only" detail="No claims, signatures, or transactions" />
          <StatCard label="Primary chain" value="Base" detail="Chain ID 8453" />
          <StatCard label="Guild sync" value="6h" detail="Curated Guild catalog" />
          <StatCard label="Security" value="Advisor" detail="Recommendations with trusted tools" />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Activity, title: "Wallet analytics", text: "Age, nonce, transactions, contract interactions, activity score." },
            { icon: ShieldCheck, title: "Security center", text: "Risk scoring, issue explanations, and revocation guidance." },
            { icon: BadgeCheck, title: "Role optimizer", text: "Eligible, locked, retired, and progress-based Guild roles." },
            { icon: Trophy, title: "Rankings", text: "Leaderboards, trending wallets, growth tracking, and comparisons." }
          ].map((item) => (
            <div key={item.title} className="card p-4">
              <item.icon className="text-[var(--primary)]" size={22} />
              <h2 className="mt-3 text-base font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
