"use client";

import { useMemo, useState } from "react";
import { closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Download, Expand, GripVertical, Palette, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import type { ProfileCardKey, WalletProfileAggregate } from "@/lib/types";

type ProfileCard = {
  key: ProfileCardKey;
  title: string;
  data: string;
  score: number;
  detail: string;
};

const cardLabels: Record<ProfileCardKey, string> = {
  walletScore: "Wallet Score",
  securityScore: "Security Score",
  opportunityScore: "Opportunity Score",
  nftCount: "NFT Count",
  guildRoles: "Guild Roles",
  eligibleRoles: "Eligible Roles",
  walletAge: "Wallet Age",
  transactionCount: "Transaction Count",
  identityCompletion: "Identity Completion",
  activityScore: "Activity Score",
  growthScore: "Growth Score",
  achievementCount: "Achievement Count"
};

export function ProfileCardGrid({ profile }: { profile: WalletProfileAggregate }) {
  const cards = useMemo(() => buildCards(profile), [profile]);
  const configuredOrder = profile.customization.cardLayout.length ? profile.customization.cardLayout : profile.generatedProfile.cardOrder;
  const [order, setOrder] = useState<ProfileCardKey[]>(configuredOrder);
  const [activeCard, setActiveCard] = useState<ProfileCard | null>(null);
  const [customizingCard, setCustomizingCard] = useState<ProfileCard | null>(null);
  const [layoutStatus, setLayoutStatus] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const visibleCards = order
    .filter((key) => profile.customization.cardVisibility[key] ?? profile.generatedProfile.cardVisibility[key] ?? true)
    .map((key) => cards.find((card) => card.key === key))
    .filter(Boolean) as ProfileCard[];

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((items) => arrayMove(items, items.indexOf(active.id as ProfileCardKey), items.indexOf(over.id as ProfileCardKey)));
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={visibleCards.map((card) => card.key)} strategy={rectSortingStrategy}>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold">Profile Cards</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Drag cards to reorder. Owner verification is required to save layout changes.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => saveCardLayout(profile, order, setLayoutStatus)}>Save Layout</Button>
          </div>
          {layoutStatus ? <p role="status" className="mb-3 text-sm text-[var(--muted-foreground)]">{layoutStatus}</p> : null}
          <section className="profile-card-grid" aria-label="Customizable wallet profile cards">
            {visibleCards.map((card) => (
              <SortableProfileCard key={card.key} card={card} profile={profile} onExpand={() => setActiveCard(card)} onCustomize={() => setCustomizingCard(card)} />
            ))}
          </section>
        </SortableContext>
      </DndContext>

      {activeCard ? <ProfileCardModal card={activeCard} profile={profile} onClose={() => setActiveCard(null)} /> : null}
      {customizingCard ? <CardCustomizer card={customizingCard} profile={profile} onClose={() => setCustomizingCard(null)} /> : null}
    </>
  );
}

async function saveCardLayout(profile: WalletProfileAggregate, order: ProfileCardKey[], setStatus: (status: string) => void) {
  const response = await fetch(`/api/profile/${profile.overview.address}/customization`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...profile.customization,
      cardLayout: order
    })
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  setStatus(response.ok ? "Card layout saved." : data.error ?? "Sign in with the owner wallet before saving layout.");
}

function SortableProfileCard({ card, profile, onExpand, onCustomize }: { card: ProfileCard; profile: WalletProfileAggregate; onExpand: () => void; onCustomize: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.key });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const shareText = buildShareText(card, profile);

  return (
    <article ref={setNodeRef} style={style} className="card profile-stat-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{card.title}</h2>
          <div className="mt-2 text-2xl font-semibold">{card.data}</div>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted-foreground)]">{card.detail}</p>
        </div>
        <button className="touch-target text-[var(--muted-foreground)]" aria-label={`Reorder ${card.title}`} {...attributes} {...listeners}>
          <GripVertical size={18} />
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge>{card.score}/100</Badge>
        <div className="flex gap-1">
          <CardIconButton label={`Share ${card.title}`} onClick={() => shareCard(card, profile)} icon={<Share2 size={15} />} />
          <CardIconButton label={`Copy ${card.title} text`} onClick={() => copyText(shareText)} icon={<Copy size={15} />} />
          <CardIconButton label={`Customize ${card.title}`} onClick={onCustomize} icon={<Palette size={15} />} />
          <CardIconButton label={`Expand ${card.title}`} onClick={onExpand} icon={<Expand size={15} />} />
        </div>
      </div>
    </article>
  );
}

function CardIconButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button type="button" className="touch-target rounded-[8px] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]" aria-label={label} title={label} onClick={onClick}>
      {icon}
    </button>
  );
}

function ProfileCardModal({ card, profile, onClose }: { card: ProfileCard; profile: WalletProfileAggregate; onClose: () => void }) {
  const shareText = buildShareText(card, profile);
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-card-modal-title">
      <div className="modal-panel card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="profile-card-modal-title" className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{card.detail}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-5 rounded-[8px] border border-[var(--border)] bg-[var(--muted)] p-5">
          <div className="text-4xl font-semibold">{card.data}</div>
          <div className="mt-2 text-sm text-[var(--muted-foreground)]">Score: {card.score}/100</div>
        </div>
        <textarea className="mt-4 min-h-32 w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] p-3 text-sm text-[var(--foreground)]" defaultValue={shareText} aria-label="Editable share text" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => shareCard(card, profile)}>Share</Button>
          <Button type="button" variant="secondary" onClick={() => copyText(shareText)}>Copy Text</Button>
          <Button type="button" variant="secondary" onClick={() => copyShareImage(card, profile)}>Copy Image</Button>
          <Button type="button" variant="secondary" onClick={() => downloadShareImage(card, profile)}>
            <Download size={15} />
            Download Image
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
          <a href={shareUrl("x", shareText)} target="_blank" rel="noreferrer">X</a>
          <a href={shareUrl("telegram", shareText)} target="_blank" rel="noreferrer">Telegram</a>
          <a href={shareUrl("farcaster", shareText)} target="_blank" rel="noreferrer">Farcaster</a>
          <button type="button" onClick={() => copyText(shareText)}>Discord Copy</button>
        </div>
      </div>
    </div>
  );
}

function CardCustomizer({ card, profile, onClose }: { card: ProfileCard; profile: WalletProfileAggregate; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="card-customizer-title">
      <div className="modal-panel card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="card-customizer-title" className="text-lg font-semibold">Customize Share Card</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{card.title}</p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {["Card Theme", "Card Size", "Card Style", "Visible Statistics", "Badge Display", "Background Option"].map((item) => (
            <label key={item} className="rounded-[8px] border border-[var(--border)] p-3 text-sm">
              <span className="block font-medium">{item}</span>
              <select className="mt-2 h-10 w-full rounded-[8px] border border-[var(--border)] bg-[var(--card)] px-2 text-[var(--foreground)]">
                <option>{item.includes("Theme") ? profile.customization.themePreference : "Default"}</option>
                <option>Compact</option>
                <option>Detailed</option>
              </select>
            </label>
          ))}
        </div>
        <div className="mt-5">
          <SharePreview card={card} profile={profile} />
        </div>
      </div>
    </div>
  );
}

function SharePreview({ card, profile }: { card: ProfileCard; profile: WalletProfileAggregate }) {
  return (
    <div className="rounded-[8px] border border-[var(--border)] p-4" style={{ backgroundColor: profile.generatedProfile.colors.secondary }}>
      <div className="text-sm" style={{ color: "#A1A1AA" }}>Wallet Intelligence</div>
      <div className="mt-2 text-2xl font-semibold" style={{ color: "#FFFFFF" }}>{card.data}</div>
      <div className="mt-1 text-sm" style={{ color: "#FFFFFF" }}>{card.title}</div>
      <Badge className="mt-3 bg-transparent" style={{ borderColor: "#FFFFFF", color: "#FFFFFF" }}>{profile.profileScores.masterScoreCategory}</Badge>
    </div>
  );
}

function buildCards(profile: WalletProfileAggregate): ProfileCard[] {
  const eligibleRoles = profile.roles.filter((role) => role.status === "eligible" || role.status === "current").length;
  const growthScore = Math.max(0, Math.min(100, Math.round(profile.growth.reduce((sum, item) => sum + item.scoreGrowth + item.roleGrowth + item.nftGrowth + item.activityGrowth, 0))));
  return [
    { key: "walletScore", title: cardLabels.walletScore, data: `${profile.profileScores.masterScore}/100`, score: profile.profileScores.masterScore, detail: `Category: ${profile.profileScores.masterScoreCategory}` },
    { key: "securityScore", title: cardLabels.securityScore, data: `${profile.security.score}/100`, score: profile.security.score, detail: `Risk: ${profile.profileScores.securityRiskCategory}` },
    { key: "opportunityScore", title: cardLabels.opportunityScore, data: `${profile.scores.opportunity}/100`, score: profile.scores.opportunity, detail: "Guild, security, identity, and activity opportunity score." },
    { key: "nftCount", title: cardLabels.nftCount, data: formatNumber(profile.nfts.totalCount), score: Math.min(100, profile.nfts.totalCount * 4), detail: "NFT portfolio footprint on Base." },
    { key: "guildRoles", title: cardLabels.guildRoles, data: formatNumber(profile.roles.length), score: profile.scores.guild, detail: "Tracked curated Guild role opportunities." },
    { key: "eligibleRoles", title: cardLabels.eligibleRoles, data: formatNumber(eligibleRoles), score: Math.min(100, eligibleRoles * 20), detail: "Roles that are current or ready to unlock." },
    { key: "walletAge", title: cardLabels.walletAge, data: profile.overview.walletAgeDays ? `${profile.overview.walletAgeDays}d` : "N/A", score: Math.min(100, Math.round(((profile.overview.walletAgeDays ?? 0) / 365) * 100)), detail: "Estimated wallet maturity from available chain data." },
    { key: "transactionCount", title: cardLabels.transactionCount, data: formatNumber(profile.overview.totalTransactions), score: Math.min(100, profile.overview.totalTransactions * 2), detail: "Total observed transaction activity." },
    { key: "identityCompletion", title: cardLabels.identityCompletion, data: `${profile.identity.completionScore}%`, score: profile.identity.completionScore, detail: "Basename, ENS, and Farcaster identity coverage." },
    { key: "activityScore", title: cardLabels.activityScore, data: `${profile.scores.activity}/100`, score: profile.scores.activity, detail: "Activity profile across transactions and contract interactions." },
    { key: "growthScore", title: cardLabels.growthScore, data: `${growthScore}/100`, score: growthScore, detail: "Snapshot-based growth score over time." },
    { key: "achievementCount", title: cardLabels.achievementCount, data: formatNumber(profile.badges.length), score: Math.min(100, profile.badges.length * 20), detail: "Generated reputation and achievement badges." }
  ];
}

function buildShareText(card: ProfileCard, profile: WalletProfileAggregate) {
  return [
    `My ${card.title} is ${card.data}`,
    `Category: ${profile.profileScores.walletHealthCategory}`,
    `Guild Opportunity Score: ${profile.scores.opportunity}/100`,
    "Check your wallet profile and see how you compare.",
    "@rubelislam0461"
  ].join("\n\n");
}

async function copyText(text: string) {
  await navigator.clipboard?.writeText(text);
}

async function shareCard(card: ProfileCard, profile: WalletProfileAggregate) {
  const text = buildShareText(card, profile);
  if (navigator.share) {
    await navigator.share({ title: card.title, text, url: window.location.href });
    return;
  }
  await copyText(text);
}

function shareUrl(target: "x" | "telegram" | "farcaster", text: string) {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(typeof window === "undefined" ? "" : window.location.href);
  if (target === "x") return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  if (target === "telegram") return `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  return `https://warpcast.com/~/compose?text=${encodedText}%20${encodedUrl}`;
}

function shareSvg(card: ProfileCard, profile: WalletProfileAggregate) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="${profile.generatedProfile.colors.secondary}"/><rect x="60" y="60" width="1080" height="510" rx="24" fill="#111111" stroke="${profile.generatedProfile.colors.primary}" stroke-width="3"/><text x="100" y="150" fill="#A1A1AA" font-family="Arial" font-size="34">Wallet Intelligence</text><text x="100" y="285" fill="#FFFFFF" font-family="Arial" font-size="82" font-weight="700">${escapeSvg(card.data)}</text><text x="100" y="360" fill="#FFFFFF" font-family="Arial" font-size="44">${escapeSvg(card.title)}</text><text x="100" y="450" fill="${profile.generatedProfile.colors.primary}" font-family="Arial" font-size="34">${escapeSvg(profile.profileScores.masterScoreCategory)}</text><text x="100" y="520" fill="#A1A1AA" font-family="Arial" font-size="28">@rubelislam0461</text></svg>`;
}

function escapeSvg(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function copyShareImage(card: ProfileCard, profile: WalletProfileAggregate) {
  const blob = new Blob([shareSvg(card, profile)], { type: "image/svg+xml" });
  if ("ClipboardItem" in window) {
    await navigator.clipboard.write([new ClipboardItem({ "image/svg+xml": blob })]);
  } else {
    await copyText(buildShareText(card, profile));
  }
}

function downloadShareImage(card: ProfileCard, profile: WalletProfileAggregate) {
  const blob = new Blob([shareSvg(card, profile)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${card.key}-wallet-intelligence.svg`;
  link.click();
  URL.revokeObjectURL(url);
}
