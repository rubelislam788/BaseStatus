import { isAddress, getAddress } from "viem";
import { z } from "zod";

export const walletAddressSchema = z
  .string()
  .trim()
  .refine((value) => isAddress(value), "Enter a valid EVM wallet address")
  .transform((value) => getAddress(value).toLowerCase());

export const searchRequestSchema = z.object({
  address: walletAddressSchema
});

export function normalizeAddress(address: string) {
  return walletAddressSchema.parse(address);
}
