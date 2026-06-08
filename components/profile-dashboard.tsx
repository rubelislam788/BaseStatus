import { AlertTriangle, CheckCircle2, ExternalLink, Lock, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/stat-card";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileCardGrid } from "@/components/profile-card-grid";
import { ProfileOwnerPanel } from "@/components/profile-owner-panel";
import { formatNumber } from "@/lib/utils";
import type { WalletProfileAggregate } from "@/lib/types";

export function ProfileDashboard({ profile }: { profile: WalletProfileAggregate }) {
  return (
    <div className="space-y-5">
      <ProfileHeader profile={profile} />

      {profile.partialFailures.length ? (
        <div className="card border-[var(--warning-border)] bg-[var(--warning-surface)] p-4 text-sm text-[var(--warning-text)]">
          Some live data sources were unavailable: {profile.partialFailures.join(", ")}.
        </div>
      ) : null}

      {profile.profileScores.securityRiskPercent > 60 ? (
        <div className="card border-[var(--destructive)] p-4 text-sm">
          <div className="font-semibold text-[var(--destructive)]">Security warning: {profile.profileScores.securityRiskCategory}</div>
          <p className="mt-2 text-[var(--muted-foreground)]">This wallet has elevated advisory risk. Review security cards before sharing or using this wallet for important activity.</p>
        </div>
      ) : null}

      <ProfileCardGrid profile={profile} />
      <ProfileOwnerPanel profile={profile} />

      <section className="stat-grid">
        <StatCard label="Wallet Health" value={profile.profileScores.walletHealthScore} detail={profile.profileScores.walletHealthCategory} />
        <StatCard label="Risk Percentage" value={`${profile.profileScores.securityRiskPercent}%`} detail={profile.profileScores.securityRiskCategory} />
        <StatCard label="Activity score" value={profile.scores.activity} />
        <StatCard label="Identity score" value={`${profile.scores.identity}%`} />
      </section>

      <div className="dashboard-grid">
        <main className="space-y-5">
          <Panel title="Wallet Overview">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Wallet age" value={profile.overview.walletAgeDays ? `${profile.overview.walletAgeDays} days` : "Unavailable"} />
              <Metric label="Nonce" value={formatNumber(profile.overview.nonce)} />
              <Metric label="Successful tx" value={formatNumber(profile.overview.successfulTransactions)} />
              <Metric label="Failed tx" value={formatNumber(profile.overview.failedTransactions)} />
              <Metric label="Contract interactions" value={formatNumber(profile.overview.contractInteractions)} />
              <Metric label="Gas spent" value={`${profile.overview.totalGasSpentEth} ETH`} />
            </div>
          </Panel>

          <Panel title="NFT Analytics">
            <div className="space-y-3">
              {profile.nfts.collections.length ? profile.nfts.collections.map((collection) => (
                <div key={collection.name} className="flex items-center justify-between gap-3 rounded-[8px] bg-[var(--muted)] p-3">
                  <span className="min-w-0 truncate text-sm font-medium">{collection.name}</span>
                  <Badge>{collection.count}</Badge>
                </div>
              )) : <EmptyState text="No NFT holdings were found from available data." />}
            </div>
          </Panel>

          <Panel title="Token Portfolio">
            <div className="space-y-3">
              {profile.tokens.tokens.length ? profile.tokens.tokens.slice(0, 8).map((token) => (
                <div key={token.contractAddress} className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] p-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{token.symbol}</div>
                    <div className="truncate text-xs text-[var(--muted-foreground)]">{token.name}</div>
                  </div>
                  <span className="shrink-0 text-sm">{formatNumber(token.balance)}</span>
                </div>
              )) : <EmptyState text="No token balances were returned by the data provider." />}
            </div>
          </Panel>

          <Panel title="Guild Role Optimizer">
            <div className="space-y-3">
              {profile.roles.map((role) => (
                <div key={`${role.guildName}-${role.roleName}`} className="rounded-[8px] border border-[var(--border)] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-[var(--muted-foreground)]">{role.guildName}</div>
                      <div className="font-semibold">{role.roleName}</div>
                    </div>
                    <Badge className={role.status === "eligible" ? "border-[var(--success)] text-[var(--success)]" : ""}>{role.status}</Badge>
                  </div>
                  <Progress value={role.progressPercent} className="mt-3" />
                  {role.missingRequirements[0] ? <p className="mt-2 text-xs text-[var(--muted-foreground)]">Next: {role.missingRequirements[0].label}</p> : null}
                </div>
              ))}
            </div>
          </Panel>
        </main>

        <aside className="space-y-5">
          <Panel title="Identity">
            <div className="space-y-3">
              <IdentityRow label="Basename" value={profile.identity.basename} />
              <IdentityRow label="ENS" value={profile.identity.ensName} />
              <IdentityRow label="Farcaster" value={profile.identity.farcasterUsername} />
            </div>
          </Panel>

          <Panel title="Security Advisor">
            <ScoreRing value={profile.security.score} label={`${profile.security.riskLevel} risk`} />
            <div className="mt-4 space-y-3">
              {profile.security.issues.length ? profile.security.issues.map((issue) => (
                <div key={issue.key} className="rounded-[8px] border border-[var(--border)] p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle size={16} />
                    {issue.title}
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted-foreground)]">{issue.impact}</p>
                  <a href={issue.toolUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 rounded-[6px] text-xs font-semibold text-[var(--primary)]">
                    Review tool <ExternalLink size={12} />
                  </a>
                </div>
              )) : <EmptyState text="No advisory issues detected from available data." />}
            </div>
          </Panel>

          <Panel title="What Should I Do Next">
            <div className="space-y-2">
              {profile.recommendations.map((item) => (
                <div key={item} className="flex gap-2 rounded-[8px] bg-[var(--muted)] p-3 text-sm">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  {item}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Achievements">
            <div className="flex flex-wrap gap-2">
              {profile.badges.length ? profile.badges.map((badge) => <Badge key={badge.key}>{badge.label}</Badge>) : <Badge>Profile Started</Badge>}
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-[8px] bg-[var(--muted)] p-3">
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function IdentityRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] p-3">
      <span className="shrink-0 text-sm">{label}</span>
      <span className="flex min-w-0 items-center gap-1 truncate text-sm font-medium">
        {value ? <CheckCircle2 size={15} className="text-[var(--primary)]" /> : <Lock size={15} className="text-[var(--muted-foreground)]" />}
        {value ?? "Missing"}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[8px] border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted-foreground)]">{text}</div>;
}
