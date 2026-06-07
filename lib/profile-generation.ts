import { shortAddress } from "@/lib/utils";
import type { IdentityProfile, ProfileCardKey, ProfileIdentity, WalletProfileAggregate } from "@/lib/types";

const adjectives = ["Prime", "Signal", "Vault", "Orbit", "Apex", "Nova", "Cipher", "Base", "Mint", "Pulse"];
const nouns = ["Builder", "Explorer", "Collector", "Strategist", "Guardian", "Scout", "Architect", "Analyst", "Voyager", "Operator"];
const palettes = [
  { primary: "#2dd4bf", secondary: "#111111", accent: "#f59e0b" },
  { primary: "#60a5fa", secondary: "#111111", accent: "#22c55e" },
  { primary: "#a78bfa", secondary: "#111111", accent: "#f97316" },
  { primary: "#f472b6", secondary: "#111111", accent: "#38bdf8" }
];

const defaultCardOrder: ProfileCardKey[] = [
  "walletScore",
  "securityScore",
  "opportunityScore",
  "nftCount",
  "guildRoles",
  "eligibleRoles",
  "walletAge",
  "transactionCount",
  "identityCompletion",
  "activityScore",
  "growthScore",
  "achievementCount"
];

function hashAddress(address: string) {
  return Array.from(address.toLowerCase()).reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 17), 0);
}

export function generateProfileIdentity(address: string, identity: IdentityProfile): ProfileIdentity {
  const hash = hashAddress(address);
  const username = identity.basename ?? identity.ensName ?? `${adjectives[hash % adjectives.length]}${nouns[(hash >> 3) % nouns.length]}${address.slice(-4)}`;
  const palette = palettes[hash % palettes.length];

  return {
    username,
    avatar: `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(address)}`,
    banner: `profile://${address}/banner/${hash}`,
    colors: palette,
    slug: username.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || shortAddress(address).replace("...", "-"),
    cardOrder: defaultCardOrder,
    cardVisibility: Object.fromEntries(defaultCardOrder.map((key) => [key, true])) as Record<ProfileCardKey, boolean>
  };
}

export function getWalletHealthCategory(score: number) {
  if (score >= 95) return "Legendary Wallet";
  if (score >= 90) return "Elite Wallet";
  if (score >= 80) return "Strong Wallet";
  if (score >= 70) return "Healthy Wallet";
  if (score >= 60) return "Average Wallet";
  if (score >= 40) return "Needs Improvement";
  return "Poor Wallet";
}

export function getMasterScoreCategory(score: number) {
  if (score >= 95) return "Legendary";
  if (score >= 90) return "Elite";
  if (score >= 80) return "Advanced";
  if (score >= 70) return "Experienced";
  if (score >= 60) return "Growing";
  if (score >= 40) return "Beginner";
  return "New User";
}

export function getSecurityRiskCategory(riskPercent: number) {
  if (riskPercent <= 20) return "Very Safe";
  if (riskPercent <= 40) return "Safe";
  if (riskPercent <= 60) return "Moderate Risk";
  if (riskPercent <= 80) return "High Risk";
  return "Critical Risk";
}

export function enrichProfileScores(profile: WalletProfileAggregate) {
  const walletHealthScore = Math.round(
    profile.scores.activity * 0.22 +
      profile.scores.security * 0.24 +
      profile.scores.identity * 0.18 +
      profile.scores.guild * 0.18 +
      Math.min(100, profile.nfts.totalCount * 4) * 0.18
  );
  const securityRiskPercent = Math.max(0, Math.min(100, 100 - profile.security.score));
  const walletAgeScore = Math.min(100, Math.round(((profile.overview.walletAgeDays ?? 0) / 365) * 100));
  const masterScore = Math.round(
    profile.scores.activity * 0.18 +
      Math.min(100, profile.overview.totalTransactions * 2) * 0.12 +
      Math.min(100, profile.nfts.totalCount * 4) * 0.12 +
      profile.scores.identity * 0.16 +
      profile.scores.security * 0.18 +
      profile.scores.guild * 0.16 +
      walletAgeScore * 0.08
  );

  return {
    walletHealthScore,
    walletHealthCategory: getWalletHealthCategory(walletHealthScore),
    securityRiskPercent,
    securityRiskCategory: getSecurityRiskCategory(securityRiskPercent),
    masterScore,
    masterScoreCategory: getMasterScoreCategory(masterScore)
  };
}
