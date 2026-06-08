"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Flame, GitCompareArrows, Home, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/leaderboards", label: "Ranks", icon: BarChart3 },
  { href: "/compare", label: "Compare", icon: GitCompareArrows },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={{ pathname: item.href }} className={cn("mobile-bottom-nav-item", active && "is-active")}>
            <item.icon size={18} aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
