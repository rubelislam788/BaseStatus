import { NextResponse } from "next/server";
import { createProfileNonce, buildSiweMessage } from "@/lib/services/profile-auth-service";
import { walletAddressSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { address?: string } | null;
  const parsed = walletAddressSchema.safeParse(body?.address);
  if (!parsed.success) return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });

  try {
    const nonce = await createProfileNonce(parsed.data);
    const siweMessage = await buildSiweMessage(nonce.address, nonce.nonce);
    return NextResponse.json({ address: nonce.address, nonce: nonce.nonce, message: siweMessage });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create nonce" }, { status: 500 });
  }
}
