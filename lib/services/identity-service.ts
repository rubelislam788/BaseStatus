import "server-only";

import { createPublicClient, http } from "viem";
import { base, mainnet } from "viem/chains";
import { CACHE_TTL } from "@/lib/constants";
import { cached } from "@/lib/cache";
import { env } from "@/lib/env";
import type { IdentityProfile } from "@/lib/types";

const ethClient = createPublicClient({ chain: mainnet, transport: http() });
const baseClient = createPublicClient({ chain: base, transport: http() });

async function fetchFarcasterUsername(address: string) {
  if (!env.NEYNAR_API_KEY) return null;
  const url = new URL("https://api.neynar.com/v2/farcaster/user/bulk-by-address");
  url.searchParams.set("addresses", address);

  const response = await fetch(url, {
    headers: { api_key: env.NEYNAR_API_KEY },
    next: { revalidate: CACHE_TTL.identity }
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { [key: string]: Array<{ username?: string }> };
  return data[address.toLowerCase()]?.[0]?.username ?? null;
}

export async function fetchIdentity(address: string): Promise<IdentityProfile> {
  return cached(`identity:${address}`, CACHE_TTL.identity, async () => {
    const [ensName, basename, farcasterUsername] = await Promise.all([
      ethClient.getEnsName({ address: address as `0x${string}` }).catch(() => null),
      baseClient.getEnsName({ address: address as `0x${string}` }).catch(() => null),
      fetchFarcasterUsername(address).catch(() => null)
    ]);

    const completionScore = [ensName, basename, farcasterUsername].filter(Boolean).length * 33 + (basename ? 1 : 0);
    return { ensName, basename, farcasterUsername, completionScore: Math.min(100, completionScore) };
  });
}
