import "server-only";

import { CACHE_TTL } from "@/lib/constants";
import { cached } from "@/lib/cache";
import { configuredGuildSlugs } from "@/lib/env";
import type { IdentityProfile, RoleProgress, RoleRequirement, WalletOverview, NftSummary, TokenSummary } from "@/lib/types";

type GuildApiRole = {
  id: number | string;
  name: string;
  description?: string;
  requirements?: unknown[];
};

type GuildApiResponse = {
  id: number | string;
  urlName?: string;
  name: string;
  imageUrl?: string;
  description?: string;
  roles?: GuildApiRole[];
};

async function fetchGuild(slug: string) {
  const response = await fetch(`https://guild.host/api/guild/access/${slug}`, {
    next: { revalidate: CACHE_TTL.guildCatalog }
  });
  if (!response.ok) return null;
  return (await response.json()) as GuildApiResponse;
}

export async function fetchCuratedGuilds() {
  return cached("guilds:curated", CACHE_TTL.guildCatalog, async () => {
    const guilds = await Promise.all(configuredGuildSlugs.map((slug) => fetchGuild(slug).catch(() => null)));
    return guilds.filter(Boolean) as GuildApiResponse[];
  });
}

function evaluateRequirement(requirement: RoleRequirement, input: { overview: WalletOverview; identity: IdentityProfile; nfts: NftSummary; tokens: TokenSummary }) {
  switch (requirement.type) {
    case "transaction_count":
      requirement.currentValue = input.overview.totalTransactions;
      return input.overview.totalTransactions >= (requirement.targetValue ?? 0);
    case "wallet_age":
      requirement.currentValue = input.overview.walletAgeDays ?? 0;
      return (input.overview.walletAgeDays ?? 0) >= (requirement.targetValue ?? 0);
    case "nft_ownership":
      requirement.currentValue = input.nfts.totalCount;
      return input.nfts.totalCount >= (requirement.targetValue ?? 1);
    case "token_ownership":
      requirement.currentValue = input.tokens.tokens.length;
      return input.tokens.tokens.length >= (requirement.targetValue ?? 1);
    case "basename":
      return Boolean(input.identity.basename);
    case "ens":
      return Boolean(input.identity.ensName);
    case "farcaster":
      return Boolean(input.identity.farcasterUsername);
    default:
      return false;
  }
}

export function parseGuildRequirement(raw: unknown): RoleRequirement {
  const text = JSON.stringify(raw).toLowerCase();
  if (text.includes("nft")) return { type: "nft_ownership", label: "Hold the required NFT", targetValue: 1 };
  if (text.includes("erc20") || text.includes("token")) return { type: "token_ownership", label: "Hold the required token", targetValue: 1 };
  if (text.includes("transaction")) return { type: "transaction_count", label: "Complete required transactions", targetValue: 5 };
  if (text.includes("basename")) return { type: "basename", label: "Have a Basename" };
  if (text.includes("ens")) return { type: "ens", label: "Have an ENS name" };
  if (text.includes("farcaster")) return { type: "farcaster", label: "Have a Farcaster account" };
  return { type: "custom", label: "Custom Guild requirement" };
}

export async function analyzeRoles(input: { overview: WalletOverview; identity: IdentityProfile; nfts: NftSummary; tokens: TokenSummary }): Promise<RoleProgress[]> {
  const guilds = await fetchCuratedGuilds();
  if (guilds.length === 0) {
    return [
      {
        guildName: "Base Builders",
        roleName: "Explorer",
        status: input.overview.totalTransactions >= 5 ? "eligible" : "locked",
        progressPercent: Math.min(100, Math.round((input.overview.totalTransactions / 5) * 100)),
        missingRequirements: input.overview.totalTransactions >= 5 ? [] : [{ type: "transaction_count", label: "Complete 5 Base transactions", targetValue: 5, currentValue: input.overview.totalTransactions }]
      }
    ];
  }

  return guilds.flatMap((guild) =>
    (guild.roles ?? []).slice(0, 20).map((role) => {
      const requirements = (role.requirements ?? []).map(parseGuildRequirement);
      const missingRequirements = requirements.filter((requirement) => !evaluateRequirement(requirement, input));
      const progressPercent = requirements.length === 0 ? 100 : Math.round(((requirements.length - missingRequirements.length) / requirements.length) * 100);
      return {
        guildName: guild.name,
        roleName: role.name,
        status: progressPercent === 100 ? "eligible" : "locked",
        progressPercent,
        missingRequirements
      };
    })
  );
}
