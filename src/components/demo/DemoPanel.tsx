"use client";

import { useState } from "react";
import { CalendarClock, CreditCard, FastForward, MapPin, Navigation, RotateCcw, Sparkles, X } from "lucide-react";
import { useDemo, useHydrated } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { activeTrip } from "@/store/actions";
import { DRIVE_PRESETS, MERCHANT_PRESETS } from "@/store/seed";
import { CATEGORY_LABEL, type MerchantCategory } from "@/engine/types";
import { formatZAR, rands } from "@/engine/money";
import { mileagePay } from "@/engine/mileage";
import { clockLabel, shortDate } from "@/lib/format";
import { useSwipe } from "./useSwipe";
import { cx } from "@/components/ui/cx";
import { Chip } from "@/components/ui/Chip";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-white/10 px-5 py-4">
      <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist/70">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function DemoPanelBody({ onClose }: { onClose?: () => void }) {
  const hydrated = useHydrated();
  const state = useDemo();
  const push = useToast((s) => s.push);
  const doSwipe = useSwipe();
  const [amount, setAmount] = useState("150");
  const [category, setCategory] = useState<MerchantCategory>("meals");
  const trip = activeTrip(state);
  const pending = state.trips.find((t) => t.employeeId === state.currentEmployeeId && t.status === "pending_approval");
  const upcoming = trip && state.clock.slice(0, 10) < trip.startDate ? trip : undefined;

  if (!hydrated) return <div className="p-5 text-sm text-mist/70">Loading demo…</div>;

  return (
    <div className="text-paper">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles size={16} className="text-orange" /> Demo controls
          </p>
          <p className="mt-1 text-[13px] text-mist/70">Play the real world: card swipes, GPS drives, time.</p>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close demo controls" className="rounded-full p-1.5 text-mist/70 hover:bg-white/10 hover:text-paper">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mx-5 mb-4 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-mist/60">Demo clock</p>
          <p className="tabular text-sm font-semibold">{clockLabel(state.clock)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.12em] text-mist/60">Live trip</p>
          <p className="max-w-[150px] truncate text-sm font-semibold">{trip ? trip.title : pending ? "Awaiting approval" : "None"}</p>
        </div>
      </div>

      <Section icon={<CreditCard size={13} />} title="Swipe the card">
        {!trip && <p className="mb-3 text-[13px] text-orange">No active trip — plan one in the app first.</p>}
        <div className="grid grid-cols-2 gap-2">
          {MERCHANT_PRESETS.map((m) => {
            const blocked = state.policy.blockedCategories.includes(m.category);
            return (
              <button
                key={m.id}
                onClick={() => doSwipe({ merchant: m.merchant, category: m.category, amount: m.amount })}
                className="group rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/[0.07] active:scale-[0.98]"
              >
                <span className="block truncate text-[13px] font-semibold">{m.merchant}</span>
                <span className="mt-0.5 flex items-center justify-between gap-1 text-[12px] text-mist/70">
                  <span className="tabular">{formatZAR(m.amount, { whole: true })}</span>
                  <span className={cx("truncate", blocked && "text-orange")}>{CATEGORY_LABEL[m.category]}</span>
                </span>
              </button>
            );
          })}
        </div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (!Number.isFinite(n) || n <= 0) return;
            doSwipe({ merchant: `Custom ${CATEGORY_LABEL[category].toLowerCase()}`, category, amount: rands(n) });
          }}
        >
          <label className="relative w-24 shrink-0">
            <span className="sr-only">Amount in rand</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-mist/60">R</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="tabular h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-2 text-sm outline-none focus:border-teal-2"
            />
          </label>
          <label className="min-w-0 flex-1">
            <span className="sr-only">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as MerchantCategory)}
              className="h-10 w-full rounded-xl border border-white/10 bg-ink-3 px-2 text-sm outline-none focus:border-teal-2"
            >
              {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <button className="h-10 shrink-0 rounded-xl bg-orange px-3 text-sm font-semibold text-ink hover:bg-[#ec9050]">Swipe</button>
        </form>
      </Section>

      <Section icon={<Navigation size={13} />} title="GPS drives">
        <div className="space-y-2">
          {DRIVE_PRESETS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                if (!trip) return push({ tone: "info", title: "No active trip", body: "Drives attach to a live trip." });
                state.addDrive({ from: d.from, to: d.to, km: d.km, minutes: d.minutes, purpose: d.purpose, gps: true });
                push({ tone: "ok", title: `Drive logged · ${d.km} km GPS-verified`, body: `${d.from} → ${d.to} · ${formatZAR(mileagePay(state.policy, d.km).total)}` });
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              <MapPin size={15} className="shrink-0 text-teal-2" />
              <span className="min-w-0 flex-1 truncate text-[13px]">
                {d.from} → {d.to}
              </span>
              <span className="tabular text-[12px] text-mist/70">{d.km} km</span>
            </button>
          ))}
          <button
            onClick={() => {
              if (!trip) return push({ tone: "info", title: "No active trip", body: "Drives attach to a live trip." });
              state.addDrive({ from: "Client, Westville", to: "Supplier, Durban CBD", km: 18, minutes: 25, purpose: "Parts collection", gps: false });
              push({ tone: "warn", title: "18 km added without GPS", body: "This will be held as an exception for finance." });
            }}
            className="w-full rounded-xl border border-dashed border-orange/50 px-3 py-2.5 text-left text-[13px] text-orange hover:bg-orange/10"
          >
            + Add 18 km manually (no GPS)
          </button>
        </div>
      </Section>

      <Section icon={<CalendarClock size={13} />} title="Time">
        <div className="flex flex-wrap gap-2">
          <button onClick={state.advanceDay} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold hover:bg-white/15">
            <FastForward size={14} /> Next day, 08:00
          </button>
          {upcoming && (
            <button
              onClick={() => state.setClock(`${upcoming.startDate}T08:00`)}
              className="inline-flex items-center gap-2 rounded-full bg-teal px-3.5 py-2 text-[13px] font-semibold hover:bg-teal-2"
            >
              Jump to {shortDate(upcoming.startDate)}
            </button>
          )}
        </div>
        {pending && <p className="mt-3 text-[13px] text-mist/70">Your trip is waiting for a manager — approve it in Finance → Trips.</p>}
      </Section>

      <Section icon={<RotateCcw size={13} />} title="Reset">
        <div className="flex items-center justify-between gap-3">
          <Chip tone="ink" className="bg-white/10">No real money moves</Chip>
          <button
            onClick={() => {
              if (confirm("Reset all demo data back to the start?")) {
                state.reset();
                push({ tone: "info", title: "Demo reset", body: "Back to Thandi, day 2 of the Durban trip." });
              }
            }}
            className="text-[13px] font-semibold text-mist/80 underline-offset-4 hover:text-paper hover:underline"
          >
            Reset demo data
          </button>
        </div>
      </Section>
    </div>
  );
}

/** Floating launcher + drawer, for pages without a docked panel. */
export function DemoLauncher({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cx(
          "fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-lift transition hover:bg-ink-3",
          className,
        )}
      >
        <Sparkles size={16} className="text-orange" /> Demo<span className="hidden sm:inline"> controls</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Demo controls">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] animate-rise overflow-y-auto rounded-t-3xl bg-ink sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[400px] sm:rounded-none">
            <DemoPanelBody onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
