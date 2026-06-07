import "server-only";

import { getSupabaseServiceClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function logSystem(level: "info" | "warn" | "error", scope: string, message: string, payload?: unknown) {
  if (!hasSupabaseConfig()) {
    console[level === "error" ? "error" : level === "warn" ? "warn" : "log"](`[${scope}] ${message}`, payload ?? "");
    return;
  }

  const supabase = getSupabaseServiceClient();
  await supabase.from("system_logs").insert({
    level,
    scope,
    message,
    payload: payload ?? {}
  });
}
