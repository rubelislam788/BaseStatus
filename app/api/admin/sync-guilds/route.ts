import { NextResponse } from "next/server";
import { assertAdminRequest, syncCuratedGuilds } from "@/lib/services/admin-service";

export async function POST() {
  try {
    await assertAdminRequest();
    return NextResponse.json(await syncCuratedGuilds());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}

export const GET = POST;
