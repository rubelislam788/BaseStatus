import { NextResponse } from "next/server";
import { searchRequestSchema } from "@/lib/validation";
import { buildWalletProfile } from "@/lib/services/profile-service";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = searchRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid wallet address" }, { status: 400 });
  }

  const address = parsed.data.address;
  await buildWalletProfile(address);
  return NextResponse.json({ address, redirectTo: `/profile/${address}` });
}
