import { describe, expect, it } from "vitest";
import { normalizeAddress } from "@/lib/validation";

describe("wallet validation", () => {
  it("normalizes valid evm addresses", () => {
    expect(normalizeAddress("0x0000000000000000000000000000000000000000")).toBe("0x0000000000000000000000000000000000000000");
  });

  it("rejects invalid input", () => {
    expect(() => normalizeAddress("not-a-wallet")).toThrow();
  });
});
