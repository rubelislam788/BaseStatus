import { NextResponse } from "next/server";
import { normalizeAddress } from "@/lib/validation";
import { buildWalletProfile } from "@/lib/services/profile-service";
import { recordWalletView } from "@/lib/services/persistence-service";

type Params = {
  params: Promise<{ address: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { address: rawAddress } = await params;
  try {
    const address = normalizeAddress(rawAddress);
    const profile = await buildWalletProfile(address);
    await recordWalletView(address);
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }
}
