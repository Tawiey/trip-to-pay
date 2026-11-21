import type { Claim, Policy, Trip, TripException } from "./types";
import { mileagePay } from "./mileage";
import { tripSpend } from "./authorise";
import { dayOf } from "./dates";
import { formatZAR } from "./money";

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The claim builds itself: card spend is already settled, only what the employee is owed is paid. */
export function buildClaim(policy: Policy, trip: Trip): Claim {
  const exceptions: TripException[] = [];

  // Dining overage on flagged meals (flag mode)
  const byTime = [...trip.txns].filter((t) => t.status === "approved").sort((a, b) => a.at.localeCompare(b.at));
  const dayTotals = new Map<string, number>();
  for (const t of byTime) {
    const day = dayOf(t.at);
    if (t.category === "meals") dayTotals.set(day, (dayTotals.get(day) ?? 0) + t.amount);
    if (t.flags.includes("dining_over_cap")) {
      const over = Math.min(t.amount, (dayTotals.get(day) ?? 0) - policy.diningCapPerDay);
      if (over > 0) {
        exceptions.push({
          id: `ex-${t.id}`,
          rule: "dining_over_cap",
          description: `Dining ${formatZAR(over)} over daily cap`,
          amount: over,
          suggested: "recover",
          status: "open",
          refId: t.id,
        });
      }
    }
    if (t.needsSlip && !t.slipAttached) {
      exceptions.push({
        id: `ex-slip-${t.id}`,
        rule: "missing_slip",
        description: `No slip for ${t.merchant}`,
        amount: t.amount,
        suggested: "ask_slip",
        status: "open",
        refId: t.id,
      });
    }
  }

  const mileageKm = round1(trip.drives.reduce((s, d) => s + d.km, 0));
  const gpsKm = round1(trip.drives.filter((d) => d.gps).reduce((s, d) => s + d.km, 0));
  let held = 0;
  for (const d of trip.drives.filter((d) => !d.gps)) {
    const amount = mileagePay(policy, d.km).total;
    held += amount;
    exceptions.push({
      id: `ex-${d.id}`,
      rule: "no_gps",
      description: `${d.km} km added without GPS`,
      amount,
      suggested: "ask_reason",
      status: "open",
      refId: d.id,
    });
  }

  const paidMileage = mileagePay(policy, gpsKm);
  const outOfPocket = trip.outOfPocket.reduce((s, r) => s + r.amount, 0);
  return {
    cardSpend: tripSpend(trip),
    mileageKm,
    gpsKm,
    paidMileage,
    held,
    outOfPocket,
    payable: paidMileage.total + outOfPocket,
    exceptions,
  };
}
