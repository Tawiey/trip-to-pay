"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Receipt, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useDemo, useHydrated } from "@/store/useDemo";
import { cx } from "@/components/ui/cx";

const TABS = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/wallet", label: "Wallet", icon: Wallet },
  { href: "/app/mileage", label: "Mileage", icon: Map },
  { href: "/app/receipts", label: "Receipts", icon: Receipt },
];

function StatusBar() {
  const clock = useDemo((s) => s.clock);
  const hydrated = useHydrated();
  return (
    <div className="hidden h-12 shrink-0 items-end justify-between px-8 pb-1.5 text-[13px] font-semibold md:flex">
      <span className="tabular">{hydrated ? clock.slice(11, 16) : ""}</span>
      <span className="flex items-center gap-1.5" aria-hidden>
        <span className="flex items-end gap-[2px]">
          {[4, 6, 8, 10].map((h) => (
            <span key={h} className="w-[3px] rounded-sm bg-ink" style={{ height: h }} />
          ))}
        </span>
        <span className="ml-1 h-[11px] w-[22px] rounded-[3px] border border-ink/60 p-[1.5px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-ink" />
        </span>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const hydrated = useHydrated();
  return (
    <div className="flex h-dvh flex-col md:h-full">
      <StatusBar />
      <main id="app-scroll" className="no-scrollbar flex-1 overflow-y-auto overscroll-contain">
        {hydrated ? children : <AppSkeleton />}
      </main>
      <nav className="shrink-0 border-t border-line bg-paper/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-1.5 backdrop-blur md:pb-5" aria-label="App">
        <ul className="grid grid-cols-4">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = href === "/app" ? path === "/app" : path.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cx("flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition", active ? "text-teal" : "text-faint hover:text-muted")}
                >
                  <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function AppSkeleton() {
  return (
    <div className="space-y-4 p-5">
      <div className="h-6 w-32 animate-pulse rounded bg-mist" />
      <div className="h-36 animate-pulse rounded-3xl bg-mist" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-mist" />
        ))}
      </div>
    </div>
  );
}

/** Page header inside the phone. */
export function ScreenHeader({ title, back, right, sub }: { title: string; back?: string; right?: ReactNode; sub?: ReactNode }) {
  return (
    <header className="px-5 pb-3 pt-3">
      {back && (
        <Link href={back} className="-ml-1 mb-2 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-teal">
          ‹ Back
        </Link>
      )}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold leading-tight">{title}</h1>
        {right}
      </div>
      {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
    </header>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("rounded-2xl border border-line bg-white", className)}>{children}</div>;
}
