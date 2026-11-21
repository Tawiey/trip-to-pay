"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { buildClaim } from "@/engine/claim";
import { formatZAR } from "@/engine/money";
import { CATEGORY_LABEL } from "@/engine/types";
import { Money } from "@/components/ui/Money";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/finance/FinanceShell";
import { ExceptionActions } from "@/components/finance/ExceptionActions";
import { StatusChip } from "@/components/finance/StatusChip";
import { dateRange, shortDate, time } from "@/lib/format";
import { cx } from "@/components/ui/cx";

const STAGES = ["Plan", "Approve", "Fund", "Travel", "Capture", "Control", "Settle", "Account", "Report"];

function reached(status: string): number {
  return status === "pending_approval" ? 1 : status === "active" ? 5 : status === "closed" ? 6 : 9;
}

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const s = useDemo();
  const trip = s.trips.find((t) => t.id === id);
  if (!trip) {
    return (
      <p className="text-muted">
        Trip not found. <Link href="/finance/trips" className="font-semibold text-teal">Back to trips</Link>
      </p>
    );
  }
  const emp = s.employees.find((e) => e.id === trip.employeeId)!;
  const claim = trip.claim ?? buildClaim(s.policy, trip);
  const done = reached(trip.status);

  return (
    <>
      <Link href="/finance/trips" className="text-sm font-semibold text-teal">
        ‹ All trips
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          <p className="mt-1 text-muted">
            {emp.name} · Grade {emp.grade} · {dateRange(trip.startDate, trip.endDate)} · {trip.purpose}
          </p>
        </div>
        {trip.status === "pending_approval" ? (
          <Button variant="teal" onClick={() => s.approveTrip(trip.id)}>
            Approve trip
          </Button>
        ) : (
          <StatusChip status={trip.status} />
        )}
      </div>

      <Card className="mt-6 overflow-x-auto p-5">
        <ol className="flex min-w-[640px] items-center">
          {STAGES.map((st, i) => (
            <li key={st} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span className={cx("grid size-7 place-items-center rounded-full text-[12px] font-bold", i < done ? (i >= 5 ? "bg-orange text-ink" : "bg-teal text-paper") : "bg-mist text-faint")}>
                  {i < done ? <Check size={14} /> : i + 1}
                </span>
                <span className={cx("text-[12px] font-semibold", i < done ? "text-ink" : "text-faint")}>{st}</span>
              </div>
              {i < STAGES.length - 1 && <span className={cx("mx-1 mb-5 h-0.5 flex-1", i < done - 1 ? "bg-teal" : "bg-mist")} />}
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {claim.exceptions.length > 0 && (
            <Card className="p-5">
              <h2 className="text-lg font-bold">Exceptions</h2>
              <ul className="mt-3 divide-y divide-line">
                {claim.exceptions.map((ex) => (
                  <li key={ex.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">{ex.description}</p>
                      <p className="text-sm text-muted">
                        <Money cents={ex.amount} />
                      </p>
                    </div>
                    {trip.claim ? <ExceptionActions ex={ex} trip={trip} /> : <Chip tone="mist">At close</Chip>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="overflow-hidden">
            <h2 className="px-5 pt-5 text-lg font-bold">Card activity</h2>
            <ul className="mt-2 divide-y divide-line">
              {[...trip.txns].sort((a, b) => a.at.localeCompare(b.at)).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-24 shrink-0 text-muted">
                    {shortDate(t.at)} {time(t.at)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{t.merchant}</span>
                  <span className="hidden text-muted sm:inline">{CATEGORY_LABEL[t.category]}</span>
                  {t.status === "declined" ? <Chip tone="orange">{t.declineReason}</Chip> : t.needsSlip ? <Chip tone={t.slipAttached ? "teal" : "orange"}>{t.slipAttached ? `VAT ${formatZAR(t.vat ?? 0)}` : "No slip"}</Chip> : null}
                  <Money cents={t.amount} className={cx("w-24 text-right font-semibold", t.status === "declined" && "text-faint line-through")} />
                </li>
              ))}
              {trip.bookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-24 shrink-0 text-muted">Booking</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{b.title}</span>
                  {!b.withinCap && <Chip tone="orange">Over cap</Chip>}
                  <Money cents={b.amount} className="w-24 text-right font-semibold" />
                </li>
              ))}
              {trip.txns.length + trip.bookings.length === 0 && <li className="px-5 py-6 text-sm text-muted">No card activity.</li>}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <h2 className="px-5 pt-5 text-lg font-bold">GPS logbook</h2>
            <ul className="mt-2 divide-y divide-line">
              {trip.drives.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="w-24 shrink-0 text-muted">
                    {shortDate(d.startAt)} {time(d.startAt)}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {d.from} → {d.to} · <span className="text-muted">{d.purpose}</span>
                  </span>
                  <Chip tone={d.gps ? "teal" : "orange"}>{d.gps ? "GPS" : "Manual"}</Chip>
                  <span className="w-20 text-right font-semibold tabular">{d.km} km</span>
                </li>
              ))}
              {trip.drives.length === 0 && <li className="px-5 py-6 text-sm text-muted">No drives.</li>}
            </ul>
          </Card>
        </div>

        <Card className="h-fit bg-ink p-5 text-paper">
          <p className="text-sm text-mist/70">{trip.claim ? "Claim" : "Claim if closed now"}</p>
          <ul className="mt-3 space-y-2.5 text-sm">
            <li className="flex justify-between"><span className="text-mist/80">Budget</span><Money cents={trip.allowance.total} /></li>
            <li className="flex justify-between"><span className="text-mist/80">Card spend (settled)</span><Money cents={claim.cardSpend} /></li>
            <li className="flex justify-between"><span className="text-mist/80">Mileage {claim.gpsKm} km</span><Money cents={claim.paidMileage.total} /></li>
            <li className="flex justify-between"><span className="text-mist/80">Out of pocket</span><Money cents={claim.outOfPocket} /></li>
            {claim.held > 0 && <li className="flex justify-between text-orange"><span>Held</span><Money cents={claim.held} /></li>}
          </ul>
          <div className="mt-4 border-t border-white/10 pt-4">
            <p className="text-sm text-mist/70">Paid to employee</p>
            <Money cents={claim.payable} className="font-display text-3xl font-bold" />
            {trip.payoutRef && <p className="mt-1 text-[12px] text-mist/60">PayShap ref {trip.payoutRef} · simulated</p>}
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 text-sm">
            <p className="flex justify-between"><span className="text-mist/80">3703 non-taxable</span><Money cents={claim.paidMileage.nonTaxable} /></p>
            <p className="mt-1.5 flex justify-between"><span className="text-mist/80">3702 taxable</span><Money cents={claim.paidMileage.taxable} /></p>
          </div>
        </Card>
      </div>
    </>
  );
}
