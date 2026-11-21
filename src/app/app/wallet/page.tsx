"use client";

import Link from "next/link";
import { ShieldCheck, Smartphone } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { diningSpentOn, remainingBudget } from "@/engine/authorise";
import { formatZAR } from "@/engine/money";
import { dayOf } from "@/engine/dates";
import { CATEGORY_LABEL } from "@/engine/types";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { Progress } from "@/components/ui/Progress";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { VirtualCard } from "@/components/app/VirtualCard";
import { TxnRow } from "@/components/app/TxnRow";
import { useMyTrips } from "@/components/app/useMyTrips";
import { shortDate, weekday } from "@/lib/format";

export default function WalletPage() {
  const policy = useDemo((s) => s.policy);
  const clock = useDemo((s) => s.clock);
  const { focus } = useMyTrips();
  const trip = focus?.card ? focus : undefined;

  if (!trip || !trip.card) {
    return (
      <div className="animate-rise">
        <ScreenHeader title="Travel wallet" />
        <div className="px-5 pt-10 text-center">
          <p className="font-semibold">No card yet</p>
          <p className="mt-1 text-sm text-muted">A virtual card lands here the moment a trip is approved.</p>
          <Link href="/app/plan" className="mt-5 inline-flex h-11 items-center rounded-full bg-orange px-5 font-semibold text-ink">
            Plan a trip
          </Link>
        </div>
      </div>
    );
  }

  const today = dayOf(clock);
  const diningDay = today >= trip.startDate && today <= trip.endDate ? today : trip.endDate;
  const dining = diningSpentOn(trip, diningDay);
  const days = [...new Set(trip.txns.map((t) => dayOf(t.at)))].sort().reverse();
  const live = trip.status === "active";

  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Travel wallet" right={live ? <Chip tone="teal" dot>Live</Chip> : <Chip tone="mist">Closed</Chip>} />
      <div className="px-5">
        <VirtualCard card={trip.card} city={trip.city} />
        {live && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-muted">
            <Smartphone size={13} /> In your phone wallet · tap to pay anywhere Mastercard works
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Panel className="col-span-2 p-4">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold">Dining {diningDay === today ? "today" : shortDate(diningDay)}</p>
              <p className="tabular text-sm text-muted">
                <span className="font-semibold text-ink">{formatZAR(dining, { whole: true })}</span> / {formatZAR(policy.diningCapPerDay, { whole: true })}
              </p>
            </div>
            <Progress value={dining / policy.diningCapPerDay} tone={dining > policy.diningCapPerDay ? "red" : "teal"} className="mt-3" />
          </Panel>
          <Panel className="p-4">
            <p className="text-[13px] text-muted">Budget left</p>
            <Money cents={Math.max(0, remainingBudget(trip))} whole className="mt-1 block font-display text-xl font-bold" />
          </Panel>
          <Panel className="p-4">
            <p className="text-[13px] text-muted">Blocked here</p>
            <p className="mt-1 text-[13px] font-semibold leading-snug">
              {policy.blockedCategories.map((c) => CATEGORY_LABEL[c]).join(", ") || "Nothing"}
            </p>
          </Panel>
        </div>

        <p className="mt-4 flex items-start gap-2 rounded-xl bg-teal-soft/60 px-3.5 py-3 text-[13px] text-teal">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          Rules run at the till: blocked merchants and the daily dining cap are enforced at authorisation, not weeks later.
        </p>

        {days.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted">No card activity yet. Use demo controls to swipe.</p>
        ) : (
          days.map((d) => (
            <section key={d} className="mt-6">
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">
                {d === today ? "Today" : `${weekday(d)} ${shortDate(d)}`}
              </h2>
              <Panel>
                <ul className="divide-y divide-line">
                  {trip.txns
                    .filter((t) => dayOf(t.at) === d)
                    .sort((a, b) => b.at.localeCompare(a.at))
                    .map((t) => (
                      <TxnRow key={t.id} txn={t} />
                    ))}
                </ul>
              </Panel>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
