import "server-only";

import { hasSupabaseConfig, getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ProfileCardKey, ProfileCustomization, WalletProfileAggregate } from "@/lib/types";

type PartialProfileCustomization = Partial<ProfileCustomization> & {
  cardVisibility?: Partial<Record<ProfileCardKey, boolean>>;
};

export async function upsertWalletProfile(address: string, aggregate: WalletProfileAggregate) {
  if (!hasSupabaseConfig()) return null;
  const supabase = getSupabaseServiceClient();

  const { data: profile, error } = await supabase
    .from("wallet_profiles")
    .upsert(
      {
        address,
        chain_id: aggregate.overview.chainId,
        display_name: aggregate.identity.basename ?? aggregate.identity.ensName ?? aggregate.identity.farcasterUsername,
        basename: aggregate.identity.basename,
        ens_name: aggregate.identity.ensName,
        farcaster_username: aggregate.identity.farcasterUsername,
        generated_username: aggregate.generatedProfile.username,
        generated_avatar: aggregate.generatedProfile.avatar,
        generated_banner: aggregate.generatedProfile.banner,
        generated_colors: aggregate.generatedProfile.colors,
        profile_slug: aggregate.generatedProfile.slug,
        privacy_settings: aggregate.customization.privacySettings,
        first_seen_at: aggregate.overview.walletAgeDays ? new Date(Date.now() - aggregate.overview.walletAgeDays * 86400000).toISOString() : null,
        last_analyzed_at: new Date().toISOString(),
        status: aggregate.partialFailures.length ? "partial" : "ready",
        metadata: { partialFailures: aggregate.partialFailures }
      },
      { onConflict: "address" }
    )
    .select("id")
    .single();

  if (error || !profile) throw error ?? new Error("Wallet profile upsert failed");

  await Promise.all([
    supabase.from("wallet_scores").upsert(
      {
        wallet_id: profile.id,
        activity_score: aggregate.scores.activity,
        security_score: aggregate.scores.security,
        identity_score: aggregate.scores.identity,
        guild_score: aggregate.scores.guild,
        opportunity_score: aggregate.scores.opportunity,
        ranking_score: aggregate.scores.opportunity
      },
      { onConflict: "wallet_id" }
    ),
    supabase.from("wallet_security").upsert(
      {
        wallet_id: profile.id,
        security_score: aggregate.security.score,
        risk_level: aggregate.security.riskLevel,
        unlimited_approvals: aggregate.security.unlimitedApprovals,
        contract_permissions: aggregate.security.contractPermissions,
        suspicious_contracts: aggregate.security.suspiciousContracts,
        analyzed_at: new Date().toISOString()
      },
      { onConflict: "wallet_id" }
    ),
    supabase.from("wallet_snapshots").insert({
      wallet_id: profile.id,
      activity_score: aggregate.scores.activity,
      security_score: aggregate.scores.security,
      identity_score: aggregate.scores.identity,
      opportunity_score: aggregate.scores.opportunity,
      nft_count: aggregate.nfts.totalCount,
      role_count: aggregate.roles.filter((role) => role.status === "eligible" || role.status === "current").length,
      transaction_count: aggregate.overview.totalTransactions,
      payload: aggregate
    })
  ]);

  await supabase.from("profile_customizations").upsert(
    {
      wallet_id: profile.id,
      display_name: aggregate.customization.displayName,
      bio: aggregate.customization.bio,
      profile_image_url: aggregate.customization.profileImageUrl,
      banner_image_url: aggregate.customization.bannerImageUrl,
      social_links: aggregate.customization.socialLinks,
      theme_preference: aggregate.customization.themePreference,
      card_layout: aggregate.customization.cardLayout,
      card_visibility: aggregate.customization.cardVisibility,
      public_profile_url: aggregate.customization.publicProfileUrl
    },
    { onConflict: "wallet_id", ignoreDuplicates: true }
  );

  await supabase.rpc("increment_search_history", { target_address: address, target_wallet_id: profile.id, target_source: "public" }).catch(async () => {
    await supabase.from("search_history").upsert({ address, wallet_id: profile.id, source: "public", last_searched_at: new Date().toISOString() }, { onConflict: "address,source" });
  });

  await Promise.all([
    supabase.from("security_issues").delete().eq("wallet_id", profile.id),
    supabase.from("wallet_nfts").delete().eq("wallet_id", profile.id),
    supabase.from("wallet_tokens").delete().eq("wallet_id", profile.id),
    supabase.from("wallet_activity").delete().eq("wallet_id", profile.id),
    supabase.from("wallet_insights").delete().eq("wallet_id", profile.id)
  ]);

  if (aggregate.security.issues.length > 0) {
    await supabase.from("security_issues").insert(
      aggregate.security.issues.map((issue) => ({
        wallet_id: profile.id,
        issue_key: issue.key,
        title: issue.title,
        impact: issue.impact,
        solution: issue.solution,
        risk_level: issue.riskLevel,
        tool_url: issue.toolUrl
      }))
    );
  }

  if (aggregate.nfts.recent.length > 0) {
    await supabase.from("wallet_nfts").insert(
      aggregate.nfts.recent.map((nft) => ({
        wallet_id: profile.id,
        chain_id: aggregate.overview.chainId,
        contract_address: nft.contractAddress,
        token_id: nft.tokenId,
        collection_name: nft.collectionName,
        image_url: nft.imageUrl
      }))
    );
  }

  if (aggregate.tokens.tokens.length > 0) {
    await supabase.from("wallet_tokens").insert(
      aggregate.tokens.tokens.map((token) => ({
        wallet_id: profile.id,
        chain_id: aggregate.overview.chainId,
        contract_address: token.contractAddress,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        usd_value: token.usdValue
      }))
    );
  }

  if (aggregate.activity.length > 0) {
    await supabase.from("wallet_activity").insert(
      aggregate.activity.map((activity) => ({
        wallet_id: profile.id,
        chain_id: aggregate.overview.chainId,
        activity_type: activity.type,
        title: activity.title,
        description: activity.description,
        occurred_at: activity.occurredAt
      }))
    );
  }

  if (aggregate.recommendations.length > 0) {
    await supabase.from("wallet_insights").insert(
      aggregate.recommendations.map((recommendation, index) => ({
        wallet_id: profile.id,
        insight_type: "recommendation",
        title: "Next action",
        body: recommendation,
        priority: index + 1
      }))
    );
  }

  if (aggregate.badges.length > 0) {
    await supabase.from("wallet_badges").upsert(
      aggregate.badges.map((badge) => ({
        wallet_id: profile.id,
        badge_key: badge.key,
        label: badge.label,
        description: badge.description
      })),
      { onConflict: "wallet_id,badge_key" }
    );
  }

  if (aggregate.growth.length > 0) {
    await supabase.from("wallet_growth").upsert(
      aggregate.growth.map((growth) => ({
        wallet_id: profile.id,
        period: growth.period,
        score_growth: growth.scoreGrowth,
        role_growth: growth.roleGrowth,
        nft_growth: growth.nftGrowth,
        activity_growth: growth.activityGrowth
      })),
      { onConflict: "wallet_id,period" }
    );
  }

  for (const role of aggregate.roles) {
    const { data: savedRole } = await supabase
      .from("guild_roles")
      .select("id,guilds!inner(name)")
      .eq("name", role.roleName)
      .eq("guilds.name", role.guildName)
      .maybeSingle();

    if (!savedRole) continue;
    await supabase.from("wallet_role_progress").upsert(
      {
        wallet_id: profile.id,
        guild_role_id: savedRole.id,
        status: role.status,
        progress_percent: role.progressPercent,
        missing_requirements: role.missingRequirements,
        checked_at: new Date().toISOString()
      },
      { onConflict: "wallet_id,guild_role_id" }
    );
  }

  return profile.id as string;
}

export async function recordWalletView(address: string) {
  if (!hasSupabaseConfig()) return;
  const supabase = getSupabaseServiceClient();
  const { data: profile } = await supabase.from("wallet_profiles").select("id").eq("address", address).maybeSingle();
  if (!profile) return;
  await supabase.rpc("increment_wallet_view", { target_wallet_id: profile.id }).catch(async () => {
    await supabase.from("wallet_views").upsert({ wallet_id: profile.id, last_viewed_at: new Date().toISOString() }, { onConflict: "wallet_id" });
  });
}

export async function fetchRecentSystemLogs() {
  if (!hasSupabaseConfig()) return [];
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.from("system_logs").select("*").order("created_at", { ascending: false }).limit(25);
  return data ?? [];
}

export async function fetchProfileCustomization(address: string): Promise<ProfileCustomization | null> {
  if (!hasSupabaseConfig()) return null;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("wallet_profiles")
    .select("privacy_settings,profile_customizations(*)")
    .eq("address", address)
    .maybeSingle();

  const customization = Array.isArray(data?.profile_customizations) ? data?.profile_customizations[0] : data?.profile_customizations;
  if (!customization) return null;

  return {
    displayName: customization.display_name ?? null,
    bio: customization.bio ?? null,
    profileImageUrl: customization.profile_image_url ?? null,
    bannerImageUrl: customization.banner_image_url ?? null,
    socialLinks: customization.social_links ?? {},
    themePreference: customization.theme_preference === "light" ? "light" : "dark",
    cardLayout: customization.card_layout ?? [],
    cardVisibility: customization.card_visibility ?? {},
    publicProfileUrl: customization.public_profile_url ?? null,
    privacySettings: data?.privacy_settings ?? {
      publicProfile: true,
      showActivity: true,
      showNfts: true,
      showTokens: true,
      showGuilds: true
    }
  };
}

export async function updateProfileCustomization(address: string, ownerAddress: string, customization: PartialProfileCustomization) {
  if (!hasSupabaseConfig()) throw new Error("Supabase is not configured.");
  const supabase = getSupabaseServiceClient();
  const { data: profile, error } = await supabase.from("wallet_profiles").select("id,address").eq("address", address).maybeSingle();
  if (error || !profile) throw new Error("Profile not found.");
  if (profile.address.toLowerCase() !== ownerAddress.toLowerCase()) throw new Error("Wallet owner verification failed.");

  await supabase.from("wallet_profiles").update({ owner_address: ownerAddress, owner_verified_at: new Date().toISOString() }).eq("id", profile.id);
  if (customization.privacySettings) {
    await supabase.from("wallet_profiles").update({ privacy_settings: customization.privacySettings }).eq("id", profile.id);
  }
  const { error: updateError } = await supabase
    .from("profile_customizations")
    .upsert(
      {
        wallet_id: profile.id,
        display_name: customization.displayName,
        bio: customization.bio,
        profile_image_url: customization.profileImageUrl,
        banner_image_url: customization.bannerImageUrl,
        social_links: customization.socialLinks,
        theme_preference: customization.themePreference,
        card_layout: customization.cardLayout,
        card_visibility: customization.cardVisibility,
        public_profile_url: customization.publicProfileUrl,
        updated_by_address: ownerAddress
      },
      { onConflict: "wallet_id" }
    );
  if (updateError) throw updateError;
}

export async function persistCuratedGuilds(guilds: Array<{ id: string | number; urlName?: string; name: string; imageUrl?: string; description?: string; roles?: Array<{ id: string | number; name: string; description?: string; requirements?: unknown[] }> }>) {
  if (!hasSupabaseConfig()) return;
  const supabase = getSupabaseServiceClient();

  for (const guild of guilds) {
    const guildId = String(guild.id);
    const slug = guild.urlName ?? guildId;
    const { data: savedGuild, error } = await supabase
      .from("guilds")
      .upsert(
        {
          guild_id: guildId,
          slug,
          name: guild.name,
          image_url: guild.imageUrl ?? null,
          description: guild.description ?? null,
          source_url: `https://guild.xyz/${slug}`,
          last_synced_at: new Date().toISOString(),
          metadata: guild
        },
        { onConflict: "guild_id" }
      )
      .select("id")
      .single();

    if (error || !savedGuild) continue;

    for (const role of guild.roles ?? []) {
      const { data: savedRole } = await supabase
        .from("guild_roles")
        .upsert(
          {
            guild_id: savedGuild.id,
            role_id: String(role.id),
            name: role.name,
            description: role.description ?? null,
            metadata: role
          },
          { onConflict: "guild_id,role_id" }
        )
        .select("id")
        .single();

      if (!savedRole) continue;
      await supabase.from("role_requirements").delete().eq("role_id", savedRole.id);
      if ((role.requirements ?? []).length > 0) {
        await supabase.from("role_requirements").insert(
          (role.requirements ?? []).map((requirement) => ({
            role_id: savedRole.id,
            requirement_type: "custom",
            label: "Guild requirement",
            raw_requirement: requirement
          }))
        );
      }
    }
  }
}
