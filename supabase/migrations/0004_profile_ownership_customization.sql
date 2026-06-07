alter table public.wallet_profiles
  add column if not exists generated_username text,
  add column if not exists generated_avatar text,
  add column if not exists generated_banner text,
  add column if not exists generated_colors jsonb not null default '{}'::jsonb,
  add column if not exists profile_slug text unique,
  add column if not exists owner_address citext,
  add column if not exists owner_verified_at timestamptz,
  add column if not exists privacy_settings jsonb not null default '{"publicProfile":true,"showActivity":true,"showNfts":true,"showTokens":true,"showGuilds":true}'::jsonb;

create table if not exists public.profile_customizations (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null unique references public.wallet_profiles(id) on delete cascade,
  display_name text,
  bio text,
  profile_image_url text,
  banner_image_url text,
  social_links jsonb not null default '{}'::jsonb,
  theme_preference text not null default 'dark',
  card_layout jsonb not null default '[]'::jsonb,
  card_visibility jsonb not null default '{}'::jsonb,
  public_profile_url text,
  share_preferences jsonb not null default '{}'::jsonb,
  updated_by_address citext,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_auth_nonces (
  id uuid primary key default gen_random_uuid(),
  address citext not null,
  nonce text not null unique,
  purpose text not null default 'profile-management',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.profile_sessions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  address citext not null,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_profiles_slug on public.wallet_profiles(profile_slug);
create index if not exists idx_wallet_profiles_owner on public.wallet_profiles(owner_address);
create index if not exists idx_profile_auth_nonces_address on public.profile_auth_nonces(address, expires_at);
create index if not exists idx_profile_sessions_hash on public.profile_sessions(session_token_hash);
create index if not exists idx_profile_sessions_wallet on public.profile_sessions(wallet_id);

create trigger set_profile_customizations_updated_at
before update on public.profile_customizations
for each row execute function public.set_updated_at();

alter table public.profile_customizations enable row level security;
alter table public.profile_auth_nonces enable row level security;
alter table public.profile_sessions enable row level security;

create policy "profile_customizations public read"
on public.profile_customizations for select
using (true);
