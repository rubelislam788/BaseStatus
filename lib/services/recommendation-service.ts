import type { IdentityProfile, RoleProgress, SecuritySummary, WalletOverview } from "@/lib/types";

export function generateRecommendations(input: {
  overview: WalletOverview;
  identity: IdentityProfile;
  security: SecuritySummary;
  roles: RoleProgress[];
}) {
  const recommendations = new Set<string>();

  if (input.overview.totalTransactions < 5) recommendations.add(`Complete ${5 - input.overview.totalTransactions} more Base transactions`);
  if (!input.identity.basename) recommendations.add("Register or connect a Basename");
  if (!input.identity.ensName) recommendations.add("Add an ENS primary identity");
  if (!input.identity.farcasterUsername) recommendations.add("Connect a Farcaster profile");
  if (input.security.issues.length > 0) recommendations.add("Review token approvals and security warnings");

  input.roles
    .filter((role) => role.status === "locked")
    .slice(0, 3)
    .forEach((role) => {
      const missing = role.missingRequirements[0]?.label ?? "the missing requirement";
      recommendations.add(`Unlock ${role.roleName} by completing ${missing}`);
    });

  return Array.from(recommendations).slice(0, 8);
}

export function generateBadges(input: { totalTransactions: number; nftCount: number; identityScore: number }) {
  return [
    input.nftCount >= 5 ? { key: "nft-collector", label: "NFT Collector", description: "Holds a meaningful NFT collection on Base." } : null,
    input.totalTransactions >= 25 ? { key: "explorer", label: "Explorer", description: "Shows consistent on-chain activity." } : null,
    input.identityScore >= 66 ? { key: "identity-ready", label: "Identity Ready", description: "Has a strong Web3 identity footprint." } : null
  ].filter(Boolean) as Array<{ key: string; label: string; description: string }>;
}
