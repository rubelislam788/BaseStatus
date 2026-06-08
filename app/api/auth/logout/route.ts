import { NextResponse } from "next/server";
import { clearProfileSession } from "@/lib/services/profile-auth-service";

export async function POST() {
  await clearProfileSession();
  return NextResponse.json({ ok: true });
}
