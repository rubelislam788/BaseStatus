create extension if not exists "pgcrypto";
create extension if not exists "citext";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table public.wallet_profiles (
  id uuid primary key default gen_random_uuid(),
  address citext not null unique,
  chain_id integer not null default 8453,
  display_name text,
  basename text,
  ens_name text,
  farcaster_username text,
  first_seen_at timestamptz,
  last_analyzed_at timestamptz,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_snapshots (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  captured_at timestamptz not null default now(),
  activity_score numeric not null default 0,
  security_score numeric not null default 0,
  identity_score numeric not null default 0,
  opportunity_score numeric not null default 0,
  nft_count integer not null default 0,
  role_count integer not null default 0,
  transaction_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_activity (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  chain_id integer not null default 8453,
  activity_type text not null,
  title text not null,
  description text,
  tx_hash text,
  contract_address citext,
  occurred_at timestamptz not null,
  amount numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_security (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null unique references public.wallet_profiles(id) on delete cascade,
  security_score numeric not null default 0,
  risk_level text not null default 'low',
  unlimited_approvals integer not null default 0,
  contract_permissions integer not null default 0,
  suspicious_contracts integer not null default 0,
  analyzed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_nfts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  chain_id integer not null default 8453,
  contract_address citext not null,
  token_id text not null,
  collection_name text,
  token_type text,
  image_url text,
  acquired_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, chain_id, contract_address, token_id)
);

create table public.wallet_tokens (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  chain_id integer not null default 8453,
  contract_address citext not null,
  symbol text,
  name text,
  decimals integer,
  raw_balance text not null default '0',
  balance numeric,
  usd_value numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, chain_id, contract_address)
);

create table public.wallet_scores (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null unique references public.wallet_profiles(id) on delete cascade,
  activity_score numeric not null default 0,
  security_score numeric not null default 0,
  identity_score numeric not null default 0,
  guild_score numeric not null default 0,
  opportunity_score numeric not null default 0,
  ranking_score numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_rankings (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  ranking_type text not null,
  rank integer not null,
  score numeric not null,
  window_start timestamptz,
  window_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, ranking_type, window_start, window_end)
);

create table public.wallet_badges (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  badge_key text not null,
  label text not null,
  description text not null,
  earned_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, badge_key)
);

create table public.wallet_growth (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  period text not null,
  score_growth numeric not null default 0,
  role_growth numeric not null default 0,
  nft_growth numeric not null default 0,
  activity_growth numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, period)
);

create table public.wallet_insights (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  insight_type text not null,
  title text not null,
  body text not null,
  priority integer not null default 50,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guilds (
  id uuid primary key default gen_random_uuid(),
  guild_id text not null unique,
  slug text not null unique,
  name text not null,
  image_url text,
  description text,
  source_url text,
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guild_roles (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  role_id text not null,
  name text not null,
  description text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(guild_id, role_id)
);

create table public.role_requirements (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.guild_roles(id) on delete cascade,
  requirement_type text not null,
  label text not null,
  target_value numeric,
  contract_address citext,
  token_symbol text,
  raw_requirement jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_role_progress (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  guild_role_id uuid not null references public.guild_roles(id) on delete cascade,
  status text not null default 'locked',
  progress_percent numeric not null default 0,
  missing_requirements jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, guild_role_id)
);

create table public.security_issues (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  issue_key text not null,
  title text not null,
  impact text not null,
  solution text not null,
  risk_level text not null,
  tool_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  address citext not null,
  wallet_id uuid references public.wallet_profiles(id) on delete set null,
  source text not null default 'public',
  search_count integer not null default 1,
  last_searched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(address, source)
);

create table public.wallet_views (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  view_count integer not null default 1,
  last_viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id)
);

create table public.wallet_trending (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallet_profiles(id) on delete cascade,
  trend_type text not null,
  score numeric not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(wallet_id, trend_type, window_start, window_end)
);

create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  scope text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_wallet_profiles_address on public.wallet_profiles(address);
create index idx_wallet_profiles_last_analyzed on public.wallet_profiles(last_analyzed_at);
create index idx_wallet_activity_wallet_time on public.wallet_activity(wallet_id, occurred_at desc);
create index idx_wallet_nfts_wallet_collection on public.wallet_nfts(wallet_id, collection_name);
create index idx_wallet_tokens_wallet_value on public.wallet_tokens(wallet_id, usd_value desc nulls last);
create index idx_wallet_scores_opportunity on public.wallet_scores(opportunity_score desc);
create index idx_wallet_rankings_type_rank on public.wallet_rankings(ranking_type, rank);
create index idx_wallet_badges_wallet on public.wallet_badges(wallet_id);
create index idx_wallet_growth_wallet_period on public.wallet_growth(wallet_id, period);
create index idx_wallet_role_progress_wallet_status on public.wallet_role_progress(wallet_id, status);
create index idx_guild_roles_role_id on public.guild_roles(role_id);
create index idx_role_requirements_type on public.role_requirements(requirement_type);
create index idx_security_issues_wallet_risk on public.security_issues(wallet_id, risk_level);
create index idx_search_history_address on public.search_history(address);
create index idx_wallet_views_count on public.wallet_views(view_count desc);
create index idx_wallet_trending_type_score on public.wallet_trending(trend_type, score desc);
create index idx_system_logs_scope_created on public.system_logs(scope, created_at desc);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'wallet_profiles','wallet_snapshots','wallet_activity','wallet_security','wallet_nfts',
    'wallet_tokens','wallet_scores','wallet_rankings','wallet_badges','wallet_growth',
    'wallet_insights','guilds','guild_roles','role_requirements','wallet_role_progress',
    'security_issues','search_history','wallet_views','wallet_trending'
  ]
  loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', tbl, tbl);
    execute format('alter table public.%I enable row level security', tbl);
    execute format('create policy "%I public read" on public.%I for select using (true)', tbl, tbl);
  end loop;
end $$;

alter table public.system_logs enable row level security;

insert into public.system_logs(level, scope, message)
values ('info', 'migration', 'Wallet Intelligence schema initialized');
