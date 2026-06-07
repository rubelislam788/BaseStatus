import "server-only";

import { fetchWalletOverview, fetchNfts, fetchTokens } from "@/lib/services/alchemy-service";
import { fetchIdentity } from "@/lib/services/identity-service";
import { analyzeSecurity } from "@/lib/services/security-service";
import { analyzeRoles } from "@/lib/services/guild-service";
import { calculateGuildScore, calculateOpportunityScore } from "@/lib/services/scoring-service";
import { generateBadges, generateRecommendations } from "@/lib/services/recommendation-service";
import { fetchProfileCustomization, upsertWalletProfile } from "@/lib/services/persistence-service";
import { logSystem } from "@/lib/services/logging-service";
import { enrichProfileScores, generateProfileIdentity } from "@/lib/profile-generation";
import type { WalletProfileAggregate } from "@/lib/types";

async function guarded<T>(scope: string, fallback: T, loader: () => Promise<T>, failures: string[]) {
  try {
    return await loader();
  } catch (error) {
    failures.push(scope);
    await logSystem("error", scope, "Profile section failed", error instanceof Error ? { message: error.message } : { error });
    return fallback;
  }
}

export async function buildWalletProfile(address: string): Promise<WalletProfileAggregate> {
  const partialFailures: string[] = [];

  const overview = await guarded(
    "wallet-overview",
    {
      address,
      chainId: 8453,
      walletAgeDays: null,
      nonce: null,
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      contractInteractions: 0,
      totalGasSpentEth: 0,
      activityScore: 0
    },
    () => fetchWalletOverview(address),
    partialFailures
  );

  const [identity, nfts, tokens] = await Promise.all([
    guarded("identity", { basename: null, ensName: null, farcasterUsername: null, completionScore: 0 }, () => fetchIdentity(address), partialFailures),
    guarded("nfts", { totalCount: 0, collections: [], recent: [] }, () => fetchNfts(address), partialFailures),
    guarded("tokens", { tokens: [], allocation: [] }, () => fetchTokens(address), partialFailures)
  ]);

  const security = await guarded("security", { score: 100, riskLevel: "low", unlimitedApprovals: 0, contractPermissions: 0, suspiciousContracts: 0, issues: [] }, () => analyzeSecurity(address, overview.totalTransactions), partialFailures);
  const roles = await guarded("guild-roles", [], () => analyzeRoles({ overview, identity, nfts, tokens }), partialFailures);
  const guildScore = calculateGuildScore(roles);
  const opportunityScore = calculateOpportunityScore({ overview, identity, security, roles, nfts });
  const generatedProfile = generateProfileIdentity(address, identity);
  const storedCustomization = await guarded("profile-customization", null, () => fetchProfileCustomization(address), partialFailures);
  const profileScores = enrichProfileScores({
    overview,
    identity,
    nfts,
    tokens,
    security,
    roles,
    recommendations: [],
    badges: [],
    growth: [],
    activity: [],
    scores: {
      activity: overview.activityScore,
      security: security.score,
      identity: identity.completionScore,
      guild: guildScore,
      opportunity: opportunityScore
    },
    generatedProfile,
    customization: storedCustomization ?? {
      displayName: null,
      bio: null,
      profileImageUrl: null,
      bannerImageUrl: null,
      socialLinks: {},
      themePreference: "dark",
      cardLayout: generatedProfile.cardOrder,
      cardVisibility: generatedProfile.cardVisibility,
      privacySettings: {
        publicProfile: true,
        showActivity: true,
        showNfts: true,
        showTokens: true,
        showGuilds: true
      },
      publicProfileUrl: null
    },
    profileScores: {
      walletHealthScore: 0,
      walletHealthCategory: "",
      securityRiskPercent: 0,
      securityRiskCategory: "",
      masterScore: 0,
      masterScoreCategory: ""
    },
    partialFailures
  });

  const aggregate: WalletProfileAggregate = {
    generatedProfile,
    customization: storedCustomization ?? {
      displayName: null,
      bio: null,
      profileImageUrl: null,
      bannerImageUrl: null,
      socialLinks: {},
      themePreference: "dark",
      cardLayout: generatedProfile.cardOrder,
      cardVisibility: generatedProfile.cardVisibility,
      privacySettings: {
        publicProfile: true,
        showActivity: true,
        showNfts: true,
        showTokens: true,
        showGuilds: true
      },
      publicProfileUrl: null
    },
    profileScores,
    overview,
    identity,
    nfts,
    tokens,
    security,
    roles,
    recommendations: generateRecommendations({ overview, identity, security, roles }),
    badges: generateBadges({ totalTransactions: overview.totalTransactions, nftCount: nfts.totalCount, identityScore: identity.completionScore }),
    growth: [
      { period: "7d", scoreGrowth: 0, roleGrowth: 0, nftGrowth: 0, activityGrowth: 0 },
      { period: "30d", scoreGrowth: 0, roleGrowth: 0, nftGrowth: 0, activityGrowth: 0 }
    ],
    activity: [
      {
        title: "Wallet analyzed",
        description: "A read-only analytics profile was generated for this address.",
        type: "analysis",
        occurredAt: new Date().toISOString()
      }
    ],
    scores: {
      activity: overview.activityScore,
      security: security.score,
      identity: identity.completionScore,
      guild: guildScore,
      opportunity: opportunityScore
    },
    partialFailures
  };

  await upsertWalletProfile(address, aggregate).catch((error) =>
    logSystem("error", "persistence", "Failed to persist wallet profile", error instanceof Error ? { message: error.message } : { error })
  );

  return aggregate;
}
