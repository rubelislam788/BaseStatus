import "server-only";

import { Network, Alchemy } from "alchemy-sdk";
import { createPublicClient, http, formatEther } from "viem";
import { base } from "viem/chains";
import { CACHE_TTL } from "@/lib/constants";
import { env } from "@/lib/env";
import { cached } from "@/lib/cache";
import type { NftSummary, TokenSummary, WalletOverview } from "@/lib/types";

const baseClient = createPublicClient({
  chain: base,
  transport: http(env.ALCHEMY_API_KEY ? `https://base-mainnet.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}` : undefined)
});

function getAlchemy() {
  if (!env.ALCHEMY_API_KEY) return null;
  return new Alchemy({ apiKey: env.ALCHEMY_API_KEY, network: Network.BASE_MAINNET });
}

export async function fetchWalletOverview(address: string): Promise<WalletOverview> {
  return cached(`overview:${address}`, CACHE_TTL.walletOverview, async () => {
    const nonce = await baseClient.getTransactionCount({ address: address as `0x${string}` }).catch(() => null);
    const blockNumber = await baseClient.getBlockNumber().catch(() => 0n);
    const activityScore = Math.min(100, Math.round((nonce ?? 0) * 2));

    return {
      address,
      chainId: 8453,
      walletAgeDays: nonce && nonce > 0 ? Math.max(1, Math.round(Number(blockNumber) / 43200)) : null,
      nonce,
      totalTransactions: nonce ?? 0,
      successfulTransactions: nonce ?? 0,
      failedTransactions: 0,
      contractInteractions: nonce ?? 0,
      totalGasSpentEth: 0,
      activityScore
    };
  });
}

export async function fetchNfts(address: string): Promise<NftSummary> {
  return cached(`nfts:${address}`, CACHE_TTL.nftAndTokens, async () => {
    const alchemy = getAlchemy();
    if (!alchemy) return { totalCount: 0, collections: [], recent: [] };

    const response = await alchemy.nft.getNftsForOwner(address, { omitMetadata: false, pageSize: 50 });
    const collectionMap = new Map<string, number>();
    const recent = response.ownedNfts.slice(0, 12).map((nft) => {
      const collectionName = nft.collection?.name ?? nft.contract.name ?? "Unknown collection";
      collectionMap.set(collectionName, (collectionMap.get(collectionName) ?? 0) + 1);
      return {
        tokenId: nft.tokenId,
        contractAddress: nft.contract.address.toLowerCase(),
        collectionName,
        imageUrl: nft.image?.cachedUrl ?? nft.image?.originalUrl ?? null
      };
    });

    return {
      totalCount: response.totalCount,
      collections: Array.from(collectionMap.entries()).map(([name, count]) => ({ name, count })),
      recent
    };
  });
}

export async function fetchTokens(address: string): Promise<TokenSummary> {
  return cached(`tokens:${address}`, CACHE_TTL.nftAndTokens, async () => {
    const alchemy = getAlchemy();
    if (!alchemy) return { tokens: [], allocation: [] };

    const balances = await alchemy.core.getTokenBalances(address);
    const nonZero = balances.tokenBalances.filter((token) => token.tokenBalance && token.tokenBalance !== "0x0").slice(0, 20);
    const tokens = await Promise.all(
      nonZero.map(async (token) => {
        const metadata = await alchemy.core.getTokenMetadata(token.contractAddress).catch(() => null);
        const decimals = metadata?.decimals ?? 18;
        const raw = BigInt(token.tokenBalance ?? "0");
        const balance = Number(formatEther(raw * 10n ** BigInt(Math.max(0, 18 - decimals))));
        return {
          symbol: metadata?.symbol ?? "TOKEN",
          name: metadata?.name ?? "Unknown token",
          balance,
          usdValue: null,
          contractAddress: token.contractAddress.toLowerCase()
        };
      })
    );

    return {
      tokens,
      allocation: tokens.slice(0, 8).map((token) => ({ name: token.symbol, value: token.balance }))
    };
  });
}
