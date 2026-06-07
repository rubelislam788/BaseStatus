import { WalletSearch } from "@/components/wallet-search";

export default function ComparePage() {
  return (
    <main className="container py-8">
      <div className="card p-5">
        <h1 className="text-2xl font-semibold">Wallet Comparison</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">Analyze one wallet first, then use the same scoring model to compare activity, NFTs, security, identity, and role eligibility.</p>
        <div className="mt-5">
          <WalletSearch />
        </div>
      </div>
    </main>
  );
}
