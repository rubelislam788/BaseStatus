import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, WalletCards } from "lucide-react";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wallet Intelligence",
    template: "%s | Wallet Intelligence"
  },
  description: "Read-only wallet analytics, security advice, and Guild role optimization for Base wallets."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="page-shell">
            <header className="site-header">
              <div className="container flex h-16 items-center justify-between gap-3">
                <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
                  <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-[var(--primary)] text-[var(--primary-foreground)]">
                    <WalletCards size={19} />
                  </span>
                  <span className="truncate">Wallet Intelligence</span>
                </Link>
                <div className="flex items-center gap-2">
                  <nav className="hidden items-center gap-3 text-sm text-[var(--muted-foreground)] md:flex" aria-label="Primary navigation">
                    <Link href="/leaderboards">Leaderboards</Link>
                    <Link href="/trending">Trending</Link>
                    <Link href="/compare">Compare</Link>
                    <Link href="/admin" className="flex items-center gap-1">
                      <ShieldCheck size={15} />
                      Admin
                    </Link>
                  </nav>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            {children}
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
