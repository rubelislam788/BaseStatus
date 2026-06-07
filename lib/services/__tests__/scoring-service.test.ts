import { describe, expect, it } from "vitest";
import { calculateGuildScore, calculateOpportunityScore } from "@/lib/services/scoring-service";
import type { IdentityProfile, NftSummary, RoleProgress, SecuritySummary, WalletOverview } from "@/lib/types";

describe("scoring service", () => {
  it("calculates guild score from role progress", () => {
    const roles = [
      { guildName: "Base", roleName: "Explorer", status: "eligible", progressPercent: 100, missingRequirements: [] },
      { guildName: "Base", roleName: "Builder", status: "locked", progressPercent: 50, missingRequirements: [] }
    ] satisfies RoleProgress[];

    expect(calculateGuildScore(roles)).toBe(75);
  });

  it("calculates a bounded opportunity score", () => {
    const overview = {
      address: "0x0000000000000000000000000000000000000000",
      chainId: 8453,
      walletAgeDays: 50,
      nonce: 20,
      totalTransactions: 20,
      successfulTransactions: 20,
      failedTransactions: 0,
      contractInteractions: 12,
      totalGasSpentEth: 0,
      activityScore: 80
    } satisfies WalletOverview;
    const identity = { basename: "alice.base.eth", ensName: null, farcasterUsername: "alice", completionScore: 67 } satisfies IdentityProfile;
    const security = { score: 90, riskLevel: "low", unlimitedApprovals: 0, contractPermissions: 0, suspiciousContracts: 0, issues: [] } satisfies SecuritySummary;
    const nfts = { totalCount: 6, collections: [], recent: [] } satisfies NftSummary;

    expect(calculateOpportunityScore({ overview, identity, security, roles: [], nfts })).toBeGreaterThan(50);
    expect(calculateOpportunityScore({ overview, identity, security, roles: [], nfts })).toBeLessThanOrEqual(100);
  });
});
