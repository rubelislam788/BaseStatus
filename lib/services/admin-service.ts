import "server-only";

import { headers } from "next/headers";
import { env } from "@/lib/env";
import { fetchCuratedGuilds } from "@/lib/services/guild-service";
import { fetchRecentSystemLogs, persistCuratedGuilds } from "@/lib/services/persistence-service";
import { logSystem } from "@/lib/services/logging-service";

export async function assertAdminRequest() {
  const headerStore = await headers();
  const cronSecret = headerStore.get("x-cron-secret") ?? headerStore.get("authorization")?.replace("Bearer ", "");
  if (env.CRON_SECRET && cronSecret === env.CRON_SECRET) return;

  const email = headerStore.get("x-admin-email");
  const allowlist = (env.ADMIN_EMAIL_ALLOWLIST ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (email && allowlist.includes(email.toLowerCase())) return;

  throw new Error("Unauthorized admin request");
}

export async function syncCuratedGuilds() {
  const guilds = await fetchCuratedGuilds();
  await persistCuratedGuilds(guilds);
  await logSystem("info", "guild-sync", `Synced ${guilds.length} curated guilds`);
  return { syncedGuilds: guilds.length, guilds: guilds.map((guild) => ({ id: guild.id, slug: guild.urlName, name: guild.name })) };
}

export async function getAdminStatus() {
  return {
    app: "Wallet Intelligence",
    mode: "read-only",
    guildSync: {
      curatedGuilds: env.GUILD_CURATED_SLUGS ?? "base-builders",
      schedule: "every 6 hours"
    },
    apiStatus: {
      alchemy: Boolean(env.ALCHEMY_API_KEY),
      basescan: Boolean(env.BASESCAN_API_KEY),
      neynar: Boolean(env.NEYNAR_API_KEY),
      supabase: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      redisReady: Boolean(env.REDIS_URL)
    },
    logs: await fetchRecentSystemLogs()
  };
}
