import { describe, expect, it } from "vitest";
import { generateProfileIdentity, getMasterScoreCategory, getSecurityRiskCategory, getWalletHealthCategory } from "@/lib/profile-generation";

describe("profile generation", () => {
  it("generates stable profile identity values", () => {
    const address = "0x0000000000000000000000000000000000000000";
    const first = generateProfileIdentity(address, { basename: null, ensName: null, farcasterUsername: null, completionScore: 0 });
    const second = generateProfileIdentity(address, { basename: null, ensName: null, farcasterUsername: null, completionScore: 0 });

    expect(first.username).toBe(second.username);
    expect(first.avatar).toContain(address);
    expect(first.cardOrder).toContain("walletScore");
  });

  it("maps health, risk, and master score categories", () => {
    expect(getWalletHealthCategory(96)).toBe("Legendary Wallet");
    expect(getWalletHealthCategory(38)).toBe("Poor Wallet");
    expect(getSecurityRiskCategory(20)).toBe("Very Safe");
    expect(getSecurityRiskCategory(81)).toBe("Critical Risk");
    expect(getMasterScoreCategory(92)).toBe("Elite");
    expect(getMasterScoreCategory(12)).toBe("New User");
  });
});
