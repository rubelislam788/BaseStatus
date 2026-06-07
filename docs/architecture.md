# Architecture

## Runtime

The app uses Next.js App Router. Browser components only submit wallet searches and render profile data. Server modules handle provider calls, Supabase service-role writes, caching, and admin operations.

## Data Flow

1. `POST /api/search` validates an EVM address and calls the profile orchestrator.
2. The orchestrator fetches Base overview, NFTs, tokens, identity, Guild progress, security analysis, scores, badges, and recommendations.
3. Supabase persistence stores the wallet profile, scores, snapshots, security state, search history, and logs.
4. `/profile/[address]` renders the aggregate in a read-only dashboard.

## Caching

The `CacheAdapter` starts with in-memory TTL caching and can be replaced by a Redis-backed implementation without changing service callers.

## Security

RLS is enabled on public tables. Public select policies expose read-only analytics, while writes are expected through service-role route handlers. Admin APIs require `CRON_SECRET` or an allowlisted admin email header.

## Profile Ownership

Profiles are automatically generated on first analysis. Profile management is owner-only through SIWE/Base Wallet verification. A nonce is created server-side, the user signs a chain-aware message, and a hashed HTTP-only session token authorizes customization APIs. Ownership only enables profile editing; it never enables transactions or Guild mutations.

## Guilds

Guild analysis is curated by `GUILD_CURATED_SLUGS`, synced every 6 hours by Vercel Cron. Unknown requirements are surfaced as custom requirements rather than hidden.
