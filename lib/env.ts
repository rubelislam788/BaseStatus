import { z } from "zod";

const envSchema = z.object({
  ALCHEMY_API_KEY: z.string().optional(),
  BASESCAN_API_KEY: z.string().optional(),
  NEYNAR_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_EMAIL_ALLOWLIST: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  REDIS_URL: z.string().optional(),
  GUILD_CURATED_SLUGS: z.string().optional()
});

export const env = envSchema.parse({
  ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY,
  NEYNAR_API_KEY: process.env.NEYNAR_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  ADMIN_EMAIL_ALLOWLIST: process.env.ADMIN_EMAIL_ALLOWLIST,
  CRON_SECRET: process.env.CRON_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  GUILD_CURATED_SLUGS: process.env.GUILD_CURATED_SLUGS
});

export const configuredGuildSlugs = (env.GUILD_CURATED_SLUGS ?? "base-builders")
  .split(",")
  .map((slug) => slug.trim())
  .filter(Boolean);
