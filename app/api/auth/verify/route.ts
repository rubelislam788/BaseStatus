import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyProfileSignature } from "@/lib/services/profile-auth-service";

const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message and signature are required" }, { status: 400 });

  try {
    return NextResponse.json(await verifyProfileSignature(parsed.data));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 401 });
  }
}
