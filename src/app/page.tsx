import Link from "next/link";
import { ArrowRight, BarChart3, Smartphone } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const STAGES = [
  { phase: "Before", items: ["Plan", "Approve", "Fund"] },
  { phase: "During", items: ["Travel", "Capture"] },
  { phase: "After", items: ["Control", "Settle", "Account", "Report"] },
];

export default function Landing() {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-16 pt-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Logo light className="text-lg" />
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-mist/80">Interactive MVP · simulated money</span>
        </header>

        <section className="mt-14 grid items-center gap-12 lg:mt-20 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-rise">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange">Business travel for South African companies</p>
            <h1 className="mt-5 text-5xl font-bold leading-[0.98] sm:text-7xl">Nobody ever fills in a claim.</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist/80">
              Policy-funded virtual cards, GPS-verified mileage and automatic settlement. The claim builds itself, checks itself
              against policy and SARS rules, and pays the employee the day the trip closes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="inline-flex h-12 items-center gap-2 rounded-full bg-orange px-6 font-semibold text-ink transition hover:bg-[#ec9050]">
                Open the employee app <ArrowRight size={18} />
              </Link>
              <Link href="/finance" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 font-semibold transition hover:bg-white/10">
                Finance console
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[300px] w-full max-w-[420px] sm:h-[340px]" aria-hidden>
            <div className="absolute right-0 top-4 h-[200px] w-[320px] rotate-[-8deg] rounded-[22px] bg-gradient-to-br from-teal to-ink-2 shadow-lift sm:w-[340px]" />
            <div className="absolute bottom-6 left-0 h-[200px] w-[320px] animate-card-in rotate-[4deg] rounded-[22px] bg-gradient-to-br from-orange to-orange-2 p-6 text-paper shadow-lift sm:w-[340px]">
              <p className="font-display text-sm font-bold tracking-[0.16em]">TRIP-TO-PAY</p>
              <p className="tabular mt-9 font-display text-2xl tracking-[0.12em]">•••• 4821</p>
              <p className="mt-6 text-sm text-paper/90">Durban client visit · 14–16 Oct</p>
            </div>
          </div>
        </section>

        <section className="mt-20 grid gap-4 md:grid-cols-2">
          <Link href="/app" className="group rounded-3xl bg-paper p-6 text-ink transition hover:-translate-y-0.5 hover:shadow-lift sm:p-8">
            <Smartphone className="text-teal" />
            <h2 className="mt-5 text-2xl font-bold">Employee app</h2>
            <p className="mt-2 text-muted">
              Be Thandi on day 2 of a Durban client visit. Pay with the card, get declined at a bar, log a drive, close the trip and get paid.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold text-teal">
              Start as Thandi <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
          <Link href="/finance" className="group rounded-3xl bg-teal p-6 text-paper transition hover:-translate-y-0.5 hover:shadow-lift sm:p-8">
            <BarChart3 className="text-paper" />
            <h2 className="mt-5 text-2xl font-bold">Finance console</h2>
            <p className="mt-2 text-paper/80">
              See exceptions, not claims. Clear them in one click, watch the journal post itself, export payroll codes 3703/3702, and edit the policy live.
            </p>
            <span className="mt-6 inline-flex items-center gap-2 font-semibold">
              Open console <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </section>

        <section className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mist/60">Nine stages, one human touch</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {STAGES.map((s, i) => (
              <div key={s.phase} className={`rounded-2xl p-5 ${i === 2 ? "bg-white/[0.06]" : "border border-white/10"}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mist/60">{s.phase} the trip</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.items.map((x) => (
                    <span key={x} className={`font-display text-lg font-semibold ${i === 2 ? "text-orange" : "text-[#6fd3bf]"}`}>
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-10 text-sm text-mist/50">
            Demo only. Cards, authorisation and PayShap payouts are simulated; SARS 2026/27 rates (R4.95/km, R595/day) are illustrative, not tax advice.
          </p>
        </section>
      </div>
    </main>
  );
}
