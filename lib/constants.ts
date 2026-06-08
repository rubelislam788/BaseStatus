export const BASE_CHAIN_ID = 8453;
export const ETHEREUM_CHAIN_ID = 1;

export const CACHE_TTL = {
  walletOverview: 15 * 60,
  nftAndTokens: 30 * 60,
  identity: 24 * 60 * 60,
  guildCatalog: 6 * 60 * 60,
  rankings: 15 * 60
} as const;

export const EXTERNAL_TOOLS = {
  revokeCash: "https://revoke.cash",
  baseApprovals: "https://basescan.org/tokenapprovalchecker",
  ethApprovals: "https://etherscan.io/tokenapprovalchecker"
} as const;
