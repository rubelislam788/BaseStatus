import { describe, expect, it } from "vitest";
import { parseGuildRequirement } from "@/lib/services/guild-service";

describe("guild requirement parser", () => {
  it("maps known requirement families", () => {
    expect(parseGuildRequirement({ type: "NFT" }).type).toBe("nft_ownership");
    expect(parseGuildRequirement({ type: "ERC20" }).type).toBe("token_ownership");
    expect(parseGuildRequirement({ name: "Farcaster account" }).type).toBe("farcaster");
  });

  it("keeps unknown requirements explicit", () => {
    expect(parseGuildRequirement({ custom: true }).type).toBe("custom");
  });
});
