import "server-only";

import { EXTERNAL_TOOLS } from "@/lib/constants";
import type { SecurityIssue, SecuritySummary } from "@/lib/types";
import { clampScore } from "@/lib/utils";

export async function analyzeSecurity(address: string, totalTransactions: number): Promise<SecuritySummary> {
  const issues: SecurityIssue[] = [];

  if (totalTransactions === 0) {
    issues.push({
      key: "new-wallet-review",
      title: "New wallet risk profile",
      impact: "A wallet with no activity has limited reputation and no historical behavior to evaluate.",
      solution: "Review the wallet again after meaningful activity appears on-chain.",
      riskLevel: "medium",
      toolUrl: EXTERNAL_TOOLS.baseApprovals
    });
  }

  const score = clampScore(100 - issues.length * 18);
  return {
    score,
    riskLevel: score > 85 ? "low" : score > 65 ? "medium" : score > 40 ? "high" : "critical",
    unlimitedApprovals: 0,
    contractPermissions: 0,
    suspiciousContracts: 0,
    issues
  };
}
