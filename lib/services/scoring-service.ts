import type { IdentityProfile, SecuritySummary, WalletOverview, RoleProgress, NftSummary } from "@/lib/types";
import { clampScore } from "@/lib/utils";

export function calculateGuildScore(roles: RoleProgress[]) {
  if (roles.length === 0) return 0;
  const average = roles.reduce((sum, role) => sum + role.progressPercent, 0) / roles.length;
  return clampScore(average);
}

export function calculateOpportunityScore(input: {
  overview: WalletOverview;
  identity: IdentityProfile;
  security: SecuritySummary;
  roles: RoleProgress[];
  nfts: NftSummary;
}) {
  const guildScore = calculateGuildScore(input.roles);
  return clampScore(
    input.overview.activityScore * 0.28 +
      input.security.score * 0.24 +
      input.identity.completionScore * 0.2 +
      guildScore * 0.2 +
      Math.min(100, input.nfts.totalCount * 4) * 0.08
  );
}
