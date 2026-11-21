"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Download, LayoutDashboard, Plane, Smartphone, SlidersHorizontal } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { cx } from "@/components/ui/cx";
import { useDemo, useHydrated } from "@/store/useDemo";
import { DemoLauncher } from "@/components/demo/DemoPanel";
import { clockLabel } from "@/lib/format";

const NAV = [
  { href: "/finance", label: "Overview", icon: LayoutDashboard },
  { href: "/finance/trips", label: "Trips", icon: Plane },
  { href: "/finance/policy", label: "Policy", icon: SlidersHorizontal },
  { href: "/finance/exports", label: "Exports", icon: Download },
];

export function FinanceShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const hydrated = useHydrated();
  const clock = useDemo((s) => s.clock);
  const pending = useDemo((s) => s.trips.filter((t) => t.status === "pending_approval").length);
  const isActive = (href: string) => (href === "/finance" ? path === "/finance" : path.startsWith(href));

  return (
    <div className="min-h-dvh bg-cream lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col bg-ink px-4 py-6 text-paper lg:flex">
        <Link href="/" className="px-2">
          <Logo light />
        </Link>
        <p className="mt-1 px-2 text-[12px] text-mist/60">Acme Engineering (Pty) Ltd</p>
        <nav className="mt-8 space-y-1" aria-label="Finance">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cx(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(href) ? "bg-white/10 text-paper" : "text-mist/70 hover:bg-white/5 hover:text-paper",
              )}
            >
              <Icon size={18} />
              {label}
              {label === "Trips" && hydrated && pending > 0 && (
                <span className="ml-auto rounded-full bg-orange px-2 py-0.5 text-[11px] font-bold text-ink">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <Link href="/app" className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-semibold text-mist/80 hover:bg-white/5 hover:text-paper">
            <Smartphone size={18} /> Employee app
          </Link>
          <p className="px-3 text-[12px] text-mist/50">Demo clock · {hydrated ? clockLabel(clock) : ""}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/">
              <Logo />
            </Link>
            <Link href="/app" className="rounded-full bg-ink px-3 py-1.5 text-[13px] font-semibold text-paper">
              Employee app
            </Link>
          </div>
          <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Finance">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cx("shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold", isActive(href) ? "bg-ink text-paper" : "text-muted")}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-8 lg:py-10">{hydrated ? children : <div className="h-96 animate-pulse rounded-3xl bg-mist" />}</main>
      </div>
      <DemoLauncher />
    </div>
  );
}

export function PageTitle({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-3xl border border-line bg-paper shadow-card", className)}>{children}</div>;
}
