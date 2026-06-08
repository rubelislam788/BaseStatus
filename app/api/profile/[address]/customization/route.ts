import { NextResponse } from "next/server";
import { z } from "zod";
import { assertProfileOwner } from "@/lib/services/profile-auth-service";
import { fetchProfileCustomization, updateProfileCustomization } from "@/lib/services/persistence-service";
import { normalizeAddress } from "@/lib/validation";

const cardKeySchema = z.enum([
  "walletScore",
  "securityScore",
  "opportunityScore",
  "nftCount",
  "guildRoles",
  "eligibleRoles",
  "walletAge",
  "transactionCount",
  "identityCompletion",
  "activityScore",
  "growthScore",
  "achievementCount"
]);

const customizationSchema = z.object({
  displayName: z.string().max(80).nullable().optional(),
  bio: z.string().max(280).nullable().optional(),
  profileImageUrl: z.string().url().nullable().optional(),
  bannerImageUrl: z.string().url().nullable().optional(),
  socialLinks: z.record(z.string().url()).optional(),
  themePreference: z.enum(["dark", "light"]).optional(),
  cardLayout: z.array(cardKeySchema).optional(),
  cardVisibility: z.record(cardKeySchema, z.boolean()).optional(),
  privacySettings: z.object({
    publicProfile: z.boolean(),
    showActivity: z.boolean(),
    showNfts: z.boolean(),
    showTokens: z.boolean(),
    showGuilds: z.boolean()
  }).optional(),
  publicProfileUrl: z.string().max(120).nullable().optional()
});

type Params = {
  params: Promise<{ address: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { address: rawAddress } = await params;
  const address = normalizeAddress(rawAddress);
  const customization = await fetchProfileCustomization(address);
  return NextResponse.json({ customization });
}

export async function PUT(request: Request, { params }: Params) {
  const { address: rawAddress } = await params;
  const address = normalizeAddress(rawAddress);
  const body = await request.json().catch(() => null);
  const parsed = customizationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid customization payload" }, { status: 400 });

  try {
    const owner = await assertProfileOwner(address);
    await updateProfileCustomization(address, owner.address, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
