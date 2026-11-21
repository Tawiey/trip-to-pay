import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AppShell } from "@/components/app/AppShell";
import { DemoLauncher, DemoPanelBody } from "@/components/demo/DemoPanel";
import { Logo } from "@/components/ui/Logo";

export default function EmployeeAppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="min-h-dvh md:bg-mist">
      <header className="mx-auto hidden max-w-6xl items-center justify-between px-8 pt-6 md:flex">
        <Link href="/" aria-label="Trip-to-Pay home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 rounded-full bg-paper p-1 text-sm font-semibold shadow-card">
          <span className="rounded-full bg-ink px-4 py-2 text-paper">Employee app</span>
          <Link href="/finance" className="rounded-full px-4 py-2 text-muted hover:text-ink">
            Finance console
          </Link>
        </nav>
      </header>
      <div className="mx-auto flex max-w-6xl items-start justify-center gap-10 md:px-8 md:py-8">
        <PhoneFrame>
          <AppShell>{children}</AppShell>
        </PhoneFrame>
        <aside className="sticky top-8 hidden max-h-[844px] w-[380px] shrink-0 overflow-y-auto rounded-[28px] bg-ink shadow-lift lg:block no-scrollbar">
          <DemoPanelBody />
        </aside>
      </div>
      <DemoLauncher className="bottom-24 lg:hidden md:bottom-8" />
    </div>
  );
}
