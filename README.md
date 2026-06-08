# Wallet Intelligence

Production-oriented read-only Web3 analytics platform for Base wallets. The app analyzes wallet activity, NFTs, token balances, identity, security posture, Guild role eligibility, recommendations, rankings, growth, trending activity, and admin operations.

## Stack

- Next.js 15 App Router, React, TypeScript
- Tailwind CSS v4 and shadcn/ui-style primitives
- Supabase PostgreSQL with migrations and RLS
- Alchemy Data/NFT APIs, Viem, Neynar, Guild API
- Vercel deployment with cron-ready Guild sync

## Local Setup

1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill provider keys.
4. Apply Supabase migrations in `supabase/migrations`.
5. Run `npm run dev`.

## Environment

Required for full production behavior:

- `ALCHEMY_API_KEY`
- `BASESCAN_API_KEY`
- `NEYNAR_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `CRON_SECRET`

Optional:

- `ADMIN_EMAIL_ALLOWLIST`
- `REDIS_URL`
- `GUILD_CURATED_SLUGS`

## Read-Only Guarantees

Analytics remain read-only: the platform does not claim Guild roles, mutate Guilds, grant token approvals, or create transactions. Wallet signatures are used only for Sign-In With Ethereum/Base Wallet ownership verification so the wallet owner can customize their public profile.

## Profile System

First analysis generates a profile username, avatar, banner identity, profile colors, card order, badges, statistics, wallet health category, security risk category, and master wallet score. Verified owners can customize display name, image URLs, banner, bio, social links, theme preference, public URL, card visibility, and card layout.

Every profile statistics card supports share, copy text, copy image, download image, customize, expand, and drag reorder interactions. Share text is generated automatically and can be edited inside the responsive card detail dialog.

## Main Routes

- `/` wallet search and overview
- `/profile/[address]` generated wallet profile
- `/compare` comparison entrypoint
- `/leaderboards` ranking surfaces
- `/trending` trending wallet surfaces
- `/admin` operational dashboard

## Verification

Run:

```bash
npm run typecheck
npm run test
npm run build
```
