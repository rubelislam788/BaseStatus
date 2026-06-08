import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/score-ring";
import { shortAddress } from "@/lib/utils";
import type { WalletProfileAggregate } from "@/lib/types";

export function ProfileHeader({ profile }: { profile: WalletProfileAggregate }) {
  const displayName = profile.customization.displayName ?? profile.identity.basename ?? profile.identity.ensName ?? profile.generatedProfile.username;
  const avatar = profile.customization.profileImageUrl ?? profile.generatedProfile.avatar;
  const bannerImage = profile.customization.bannerImageUrl;

  return (
    <section className="card overflow-hidden">
      <div className="profile-banner" style={{ backgroundColor: profile.generatedProfile.colors.secondary }}>
        {bannerImage ? <img src={bannerImage} alt="" className="size-full object-cover" /> : <div className="profile-banner-mark" style={{ backgroundColor: profile.generatedProfile.colors.primary }} />}
      </div>
      <div className="p-4 sm:p-5">
        <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <img src={avatar} alt={`${displayName} avatar`} className="size-24 rounded-[8px] border-4 border-[var(--card)] bg-[var(--muted)]" />
            <div className="mt-3">
              <h1 className="break-words text-2xl font-semibold sm:text-3xl">{displayName}</h1>
              {profile.customization.bio ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">{profile.customization.bio}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{profile.profileScores.walletHealthCategory}</Badge>
                <Badge>{profile.profileScores.masterScoreCategory}</Badge>
                <Badge>{profile.security.riskLevel} health</Badge>
              </div>
            </div>
          </div>
          <ScoreRing value={profile.profileScores.masterScore} label="Master Score" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeaderMetric label="Wallet" value={shortAddress(profile.overview.address)} />
          <HeaderMetric label="Basename" value={profile.identity.basename ?? "Missing"} />
          <HeaderMetric label="ENS" value={profile.identity.ensName ?? "Missing"} />
          <HeaderMetric label="Farcaster" value={profile.identity.farcasterUsername ?? "Missing"} />
          <HeaderMetric label="Wallet Rank" value="Rank pending" />
          <HeaderMetric label="Category" value={profile.profileScores.masterScoreCategory} />
          <HeaderMetric label="Health" value={profile.profileScores.walletHealthCategory} />
          <HeaderMetric label="Public URL" value={profile.customization.publicProfileUrl ?? `/${profile.generatedProfile.slug}`} />
        </div>
      </div>
    </section>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-3">
      <div className="text-xs text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}
