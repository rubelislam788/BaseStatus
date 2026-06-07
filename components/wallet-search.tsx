"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function WalletSearch() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address })
      });
      const data = (await response.json()) as { error?: string; redirectTo?: string };
      if (!response.ok || !data.redirectTo) {
        setError(data.error ?? "Unable to analyze this wallet");
        return;
      }
      router.push(data.redirectTo);
    });
  }

  return (
    <form onSubmit={submit} className="card relative flex flex-col gap-3 p-3 sm:flex-row">
      <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Search any 0x wallet address" aria-label="Wallet address" />
      <Button type="submit" disabled={isPending} className="min-h-11 sm:w-40">
        <Search size={16} />
        {isPending ? "Analyzing" : "Analyze"}
      </Button>
      {error ? <p role="alert" className="text-sm text-[var(--destructive)] sm:absolute sm:mt-12">{error}</p> : null}
    </form>
  );
}
