import { NextResponse } from "next/server";
import { assertAdminRequest, getAdminStatus } from "@/lib/services/admin-service";

export async function GET() {
  try {
    await assertAdminRequest();
    return NextResponse.json(await getAdminStatus());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 401 });
  }
}
