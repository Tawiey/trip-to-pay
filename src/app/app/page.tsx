"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BedDouble, ChevronRight, CircleCheck, Clock3, CreditCard, MapPinned, Plus, Route } from "lucide-react";
import { useDemo, useCurrentEmployee } from "@/store/useDemo";
import { tripSpend } from "@/engine/authorise";
import { formatZAR } from "@/engine/money";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { Progress } from "@/components/ui/Progress";
import { Sheet } from "@/components/app/Sheet";
import { useMyTrips } from "@/components/app/useMyTrips";
import { dateRange, initials, shortDate } from "@/lib/format";
import type { Trip } from "@/engine/types";

function Tile({ href, icon, label, value, note }: { href: string; icon: React.ReactNode; label: string; value: string; note?: React.ReactNode }) {
  return (
    <Link href={href} className="group rounded-2xl border border-line bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card">
      <span className="text-teal">{icon}</span>
      <p className="mt-3 text-[15px] font-bold">{label}</p>
      <p className="tabular text-sm text-muted">{value}</p>
      {note && <div className="mt-1.5">{note}</div>}
    </Link>
  );
}

function ActiveTrip({ trip, clock }: { trip: Trip; clock: string }) {
  const router = useRouter();
  const closeTrip = useDemo((s) => s.closeTrip);
  const [confirming, setConfirming] = useState(false);
  const spent = tripSpend(trip);
  const left = trip.allowance.total - spent;
  const cardSpend = trip.txns.filter((t) => t.status === "approved").reduce((s, t) => s + t.amount, 0);
  const km = Math.round(trip.drives.reduce((s, d) => s + d.km, 0) * 10) / 10;
  const slipsNeeded = trip.txns.filter((t) => t.needsSlip && !t.slipAttached).length;
  const matched = trip.txns.filter((t) => t.status === "approved").length - slipsNeeded + trip.outOfPocket.length;
  const notStarted = clock.slice(0, 10) < trip.startDate;

  return (
    <>
      <section className="px-5">
        <h1 className="text-[26px] font-bold leading-tight">{trip.title}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip tone="teal">
            {dateRange(trip.startDate, trip.endDate)} · {trip.approval === "auto" ? "Approved" : "Manager approved"}
          </Chip>
          {notStarted && <Chip tone="mist">Starts {shortDate(trip.startDate)}</Chip>}
        </div>

        <div className="mt-5 rounded-3xl bg-ink p-5 text-paper">
          <p className="text-sm text-mist/80">Trip budget left</p>
          <p className="mt-1 font-display text-[34px] font-bold leading-none">
            <Money cents={Math.max(0, left)} whole />
          </p>
          <Progress value={spent / Math.max(1, trip.allowance.total)} tone="orange" track="bg-white/15" className="mt-4" />
          <p className="tabular mt-2.5 text-sm text-mist/80">
            of {formatZAR(trip.allowance.total, { whole: true })} · {trip.allowance.days} day{trip.allowance.days === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Tile href="/app/wallet" icon={<CreditCard size={20} />} label="Card" value={formatZAR(cardSpend, { whole: true })} />
          <Tile href="/app/mileage" icon={<MapPinned size={20} />} label="Mileage" value={`${km} km`} />
          <Tile href="/app/bookings" icon={<BedDouble size={20} />} label="Bookings" value={`${trip.bookings.length} booked`} />
          <Tile
            href="/app/receipts"
            icon={<CircleCheck size={20} />}
            label="Receipts"
            value={`${matched} matched`}
            note={slipsNeeded > 0 && <Chip tone="orange">{slipsNeeded} slip{slipsNeeded > 1 ? "s" : ""} needed</Chip>}
          />
        </div>

        <Button size="lg" className="mt-4 w-full" onClick={() => setConfirming(true)}>
          Close trip
        </Button>
        <p className="mt-2 text-center text-[12px] text-faint">One tap builds, checks and pays your claim.</p>
      </section>

      <Sheet open={confirming} onClose={() => setConfirming(false)} label="Close trip">
        <h2 className="text-xl font-bold">Close {trip.title}?</h2>
        <p className="mt-2 text-sm text-muted">
          Your card stops working and we build your claim from card spend, GPS drives and slips. Nothing to fill in.
        </p>
        <div className="mt-5 grid gap-2">
          <Button
            size="lg"
            onClick={() => {
              closeTrip(trip.id);
              router.push(`/app/claim/${trip.id}`);
            }}
          >
            Close trip & build claim
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setConfirming(false)}>
            Not yet
          </Button>
        </div>
      </Sheet>
    </>
  );
}

export default function Home() {
  const emp = useCurrentEmployee();
  const clock = useDemo((s) => s.clock);
  const { active, closed, pending, paid } = useMyTrips();

  return (
    <div className="pb-8 animate-rise">
      <div className="flex items-center justify-between px-5 pb-2 pt-3">
        <p className="text-[15px] text-muted">Hi {emp.name.split(" ")[0]}</p>
        <Link href="/app/profile" className="grid size-9 place-items-center rounded-full bg-teal-soft text-[13px] font-bold text-teal" aria-label="Profile">
          {initials(emp.name)}
        </Link>
      </div>

      {closed && (
        <Link href={`/app/claim/${closed.id}`} className="mx-5 mb-4 flex items-center gap-3 rounded-2xl bg-teal p-4 text-paper">
          <CircleCheck size={22} />
          <div className="flex-1">
            <p className="font-semibold">Claim ready to confirm</p>
            <p className="text-sm text-paper/80">
              {closed.title} · <Money cents={closed.claim?.payable ?? 0} /> to you
            </p>
          </div>
          <ChevronRight size={18} />
        </Link>
      )}

      {active ? (
        <ActiveTrip trip={active} clock={clock} />
      ) : pending ? (
        <section className="px-5">
          <h1 className="text-[26px] font-bold leading-tight">{pending.title}</h1>
          <div className="mt-2">
            <Chip tone="orange" dot>
              Waiting for manager
            </Chip>
          </div>
          <div className="mt-5 rounded-3xl border border-line bg-white p-5">
            <Clock3 className="text-orange" />
            <p className="mt-3 font-semibold">One tap from your manager</p>
            <p className="mt-1 text-sm text-muted">
              You asked for <Money cents={pending.allowance.total} whole /> — above policy, so a manager approves once. Your card lands in the wallet the moment they do.
            </p>
          </div>
        </section>
      ) : (
        !closed && (
          <section className="px-5 pt-6 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-teal-soft text-teal">
              <Route size={28} />
            </div>
            <h1 className="mt-5 text-[26px] font-bold">No trip on the go</h1>
            <p className="mx-auto mt-2 max-w-[260px] text-sm text-muted">Tell us where, when and why. Policy sets the budget and your card arrives instantly.</p>
            <Link href="/app/plan" className="mt-6 inline-flex h-[52px] items-center gap-2 rounded-full bg-orange px-6 font-semibold text-ink">
              <Plus size={18} /> Plan a trip
            </Link>
          </section>
        )
      )}

      {(active || pending || closed) && (
        <div className="mt-6 px-5">
          <Link href="/app/plan" className="flex items-center justify-between rounded-2xl border border-dashed border-line px-4 py-3.5 text-sm font-semibold text-muted hover:border-teal hover:text-teal">
            <span className="flex items-center gap-2">
              <Plus size={16} /> Plan another trip
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>
      )}

      {paid.length > 0 && (
        <section className="mt-7 px-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-faint">Past trips</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white">
            {paid.map((t) => (
              <li key={t.id}>
                <Link href={`/app/claim/${t.id}`} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{t.title}</p>
                    <p className="text-[13px] text-muted">{dateRange(t.startDate, t.endDate)} · paid same day</p>
                  </div>
                  <Money cents={t.claim?.payable ?? 0} className="font-semibold" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
