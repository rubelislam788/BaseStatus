import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, asChild, variant = "primary", ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return (
    <Component
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-[8px] px-4 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-95",
        variant === "secondary" && "border border-[var(--border)] bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--muted)]",
        variant === "ghost" && "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
        variant === "danger" && "bg-[var(--destructive)] text-[var(--primary-foreground)] hover:brightness-95",
        className
      )}
      {...props}
    />
  );
}
