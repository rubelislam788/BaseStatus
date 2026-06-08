"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WalletProfileAggregate } from "@/lib/types";

declare global {
  interface Window {
    ethereum?: {
      request: <T = unknown>(args: { method: string; params?: unknown[] }) => Promise<T>;
    };
  }
}

export function ProfileOwnerPanel({ profile }: { profile: WalletProfileAggregate }) {
  const [displayName, setDisplayName] = useState(profile.customization.displayName ?? "");
  const [bio, setBio] = useState(profile.customization.bio ?? "");
  const [profileImageUrl, setProfileImageUrl] = useState(profile.customization.profileImageUrl ?? "");
  const [bannerImageUrl, setBannerImageUrl] = useState(profile.customization.bannerImageUrl ?? "");
  const [publicProfileUrl, setPublicProfileUrl] = useState(profile.customization.publicProfileUrl ?? "");
  const [themePreference, setThemePreference] = useState<"dark" | "light">(profile.customization.themePreference);
  const [socialLinks, setSocialLinks] = useState({
    x: profile.customization.socialLinks.x ?? "",
    telegram: profile.customization.socialLinks.telegram ?? "",
    discord: profile.customization.socialLinks.discord ?? "",
    farcaster: profile.customization.socialLinks.farcaster ?? ""
  });
  const [cardVisibility, setCardVisibility] = useState(profile.customization.cardVisibility);
  const [privacySettings, setPrivacySettings] = useState(profile.customization.privacySettings);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function signInAndSave() {
    startTransition(async () => {
      try {
        if (!window.ethereum) throw new Error("Base Wallet or an Ethereum wallet is required.");
        const accounts = await window.ethereum.request<string[]>({ method: "eth_requestAccounts" });
        const address = accounts[0];
        if (!address) throw new Error("No wallet address returned.");

        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x2105" }]
        }).catch(() => null);

        const nonceResponse = await fetch("/api/auth/nonce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address })
        });
        const nonceData = (await nonceResponse.json()) as { message?: string; error?: string };
        if (!nonceResponse.ok || !nonceData.message) throw new Error(nonceData.error ?? "Could not create sign-in message.");

        const signature = await window.ethereum.request<string>({
          method: "personal_sign",
          params: [nonceData.message, address]
        });

        const verifyResponse = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: nonceData.message, signature })
        });
        const verifyData = (await verifyResponse.json()) as { error?: string };
        if (!verifyResponse.ok) throw new Error(verifyData.error ?? "Wallet ownership verification failed.");

        const updateResponse = await fetch(`/api/profile/${profile.overview.address}/customization`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            displayName: displayName || null,
            bio: bio || null,
            profileImageUrl: profileImageUrl || null,
            bannerImageUrl: bannerImageUrl || null,
            publicProfileUrl: publicProfileUrl || null,
            socialLinks: Object.fromEntries(Object.entries(socialLinks).filter(([, value]) => value)),
            themePreference,
            cardLayout: profile.customization.cardLayout,
            cardVisibility,
            privacySettings
          })
        });
        const updateData = (await updateResponse.json()) as { error?: string };
        if (!updateResponse.ok) throw new Error(updateData.error ?? "Could not save profile customization.");
        setStatus("Profile customization saved.");
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Unable to update profile.");
      }
    });
  }

  return (
    <section className="card p-4">
      <h2 className="text-base font-semibold">Owner Customization</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">Sign with the wallet that owns this profile to edit profile identity, cards, privacy, and sharing preferences.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" aria-label="Display name" />
        <Input value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Short bio" aria-label="Bio" />
        <Input value={profileImageUrl} onChange={(event) => setProfileImageUrl(event.target.value)} placeholder="Profile image URL" aria-label="Profile image URL" />
        <Input value={bannerImageUrl} onChange={(event) => setBannerImageUrl(event.target.value)} placeholder="Banner image URL" aria-label="Banner image URL" />
        <Input value={publicProfileUrl} onChange={(event) => setPublicProfileUrl(event.target.value)} placeholder="Public profile URL" aria-label="Public profile URL" />
        <label className="text-sm">
          <span className="mb-2 block text-[var(--muted-foreground)]">Theme preference</span>
          <select className="h-11 w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-3 text-[var(--foreground)]" value={themePreference} onChange={(event) => setThemePreference(event.target.value === "light" ? "light" : "dark")}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <Input value={socialLinks.x} onChange={(event) => setSocialLinks((current) => ({ ...current, x: event.target.value }))} placeholder="X profile URL" aria-label="X profile URL" />
        <Input value={socialLinks.telegram} onChange={(event) => setSocialLinks((current) => ({ ...current, telegram: event.target.value }))} placeholder="Telegram URL" aria-label="Telegram URL" />
        <Input value={socialLinks.discord} onChange={(event) => setSocialLinks((current) => ({ ...current, discord: event.target.value }))} placeholder="Discord invite/profile URL" aria-label="Discord URL" />
        <Input value={socialLinks.farcaster} onChange={(event) => setSocialLinks((current) => ({ ...current, farcaster: event.target.value }))} placeholder="Farcaster URL" aria-label="Farcaster URL" />
      </div>
      <div className="mt-4">
        <div className="text-sm font-semibold">Card Visibility</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {profile.generatedProfile.cardOrder.map((key) => (
            <label key={key} className="flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--border)] p-3 text-sm">
              <input
                type="checkbox"
                checked={cardVisibility[key] ?? true}
                onChange={(event) => setCardVisibility((current) => ({ ...current, [key]: event.target.checked }))}
              />
              <span>{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-sm font-semibold">Privacy Settings</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["publicProfile", "Public profile"],
            ["showActivity", "Show activity"],
            ["showNfts", "Show NFTs"],
            ["showTokens", "Show tokens"],
            ["showGuilds", "Show Guilds"]
          ].map(([key, label]) => (
            <label key={key} className="flex min-h-11 items-center gap-2 rounded-[8px] border border-[var(--border)] p-3 text-sm">
              <input
                type="checkbox"
                checked={privacySettings[key as keyof typeof privacySettings]}
                onChange={(event) => setPrivacySettings((current) => ({ ...current, [key]: event.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={signInAndSave} disabled={isPending}>{isPending ? "Verifying" : "Sign In With Base Wallet"}</Button>
        <Button type="button" variant="secondary" onClick={signInAndSave} disabled={isPending}>Sign-In With Ethereum</Button>
      </div>
      {status ? <p role="status" className="mt-3 text-sm text-[var(--muted-foreground)]">{status}</p> : null}
    </section>
  );
}
