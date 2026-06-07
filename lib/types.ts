export type RiskLevel = "low" | "medium" | "high" | "critical";
export type RoleStatus = "current" | "eligible" | "locked" | "retired";
export type RequirementType =
  | "nft_ownership"
  | "token_ownership"
  | "wallet_age"
  | "transaction_count"
  | "basename"
  | "ens"
  | "farcaster"
  | "custom";

export type ProfileCardKey =
  | "walletScore"
  | "securityScore"
  | "opportunityScore"
  | "nftCount"
  | "guildRoles"
  | "eligibleRoles"
  | "walletAge"
  | "transactionCount"
  | "identityCompletion"
  | "activityScore"
  | "growthScore"
  | "achievementCount";

export type ProfileIdentity = {
  username: string;
  avatar: string;
  banner: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  slug: string;
  cardOrder: ProfileCardKey[];
  cardVisibility: Record<ProfileCardKey, boolean>;
};

export type ProfileCustomization = {
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
  socialLinks: Record<string, string>;
  themePreference: "dark" | "light";
  cardLayout: ProfileCardKey[];
  cardVisibility: Record<ProfileCardKey, boolean>;
  privacySettings: {
    publicProfile: boolean;
    showActivity: boolean;
    showNfts: boolean;
    showTokens: boolean;
    showGuilds: boolean;
  };
  publicProfileUrl: string | null;
};

export type ProfileScores = {
  walletHealthScore: number;
  walletHealthCategory: string;
  securityRiskPercent: number;
  securityRiskCategory: string;
  masterScore: number;
  masterScoreCategory: string;
};

export type WalletOverview = {
  address: string;
  chainId: number;
  walletAgeDays: number | null;
  nonce: number | null;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  contractInteractions: number;
  totalGasSpentEth: number;
  activityScore: number;
};

export type IdentityProfile = {
  basename: string | null;
  ensName: string | null;
  farcasterUsername: string | null;
  completionScore: number;
};

export type NftSummary = {
  totalCount: number;
  collections: Array<{ name: string; count: number }>;
  recent: Array<{ tokenId: string; contractAddress: string; collectionName: string; imageUrl: string | null }>;
};

export type TokenSummary = {
  tokens: Array<{ symbol: string; name: string; balance: number; usdValue: number | null; contractAddress: string }>;
  allocation: Array<{ name: string; value: number }>;
};

export type SecurityIssue = {
  key: string;
  title: string;
  impact: string;
  solution: string;
  riskLevel: RiskLevel;
  toolUrl: string;
};

export type SecuritySummary = {
  score: number;
  riskLevel: RiskLevel;
  unlimitedApprovals: number;
  contractPermissions: number;
  suspiciousContracts: number;
  issues: SecurityIssue[];
};

export type RoleRequirement = {
  type: RequirementType;
  label: string;
  targetValue?: number;
  currentValue?: number;
};

export type RoleProgress = {
  guildName: string;
  roleName: string;
  status: RoleStatus;
  progressPercent: number;
  missingRequirements: RoleRequirement[];
};

export type WalletProfileAggregate = {
  generatedProfile: ProfileIdentity;
  customization: ProfileCustomization;
  profileScores: ProfileScores;
  overview: WalletOverview;
  identity: IdentityProfile;
  nfts: NftSummary;
  tokens: TokenSummary;
  security: SecuritySummary;
  roles: RoleProgress[];
  recommendations: string[];
  badges: Array<{ key: string; label: string; description: string }>;
  growth: Array<{ period: string; scoreGrowth: number; roleGrowth: number; nftGrowth: number; activityGrowth: number }>;
  activity: Array<{ title: string; description: string; type: string; occurredAt: string }>;
  scores: {
    activity: number;
    security: number;
    identity: number;
    guild: number;
    opportunity: number;
  };
  partialFailures: string[];
};
