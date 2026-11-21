/**
 * Pure state transitions for the demo. The Zustand store wraps these;
 * keeping them pure makes them testable and easy to move server-side later.
 */
import { computeAllowance } from "@/engine/allowance";
import { buildClaim } from "@/engine/claim";
import { mileagePay } from "@/engine/mileage";
import { addDays } from "@/engine/dates";
import type { City, MerchantCategory, Policy, Trip, TripException, Txn } from "@/engine/types";
import type { Cents } from "@/engine/money";
import { simulatedBank } from "@/rails/simulated";
import { makeRoute, type SeedState } from "./seed";

export type DemoState = SeedState;

let counter = 0;
export const uid = (p: string) => `${p}-${Date.now().toString(36)}${(counter++).toString(36)}`;

export function addMinutes(iso: string, minutes: number): string {
  const [d, t] = iso.split("T");
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const dayShift = Math.floor(total / 1440);
  const rem = ((total % 1440) + 1440) % 1440;
  return `${addDays(d, dayShift)}T${String(Math.floor(rem / 60)).padStart(2, "0")}:${String(rem % 60).padStart(2, "0")}`;
}

function updateTrip(s: DemoState, id: string, fn: (t: Trip) => Trip): DemoState {
  return { ...s, trips: s.trips.map((t) => (t.id === id ? fn(t) : t)) };
}

/** The current employee's live trip, if any. */
export function activeTrip(s: DemoState): Trip | undefined {
  return s.trips
    .filter((t) => t.employeeId === s.currentEmployeeId && t.status === "active")
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
}

export interface PlanInput {
  title: string;
  city: City;
  startDate: string;
  endDate: string;
  purpose: string;
  /** Budget requested above policy — needs one manager tap. */
  extra: Cents;
}

export function planTrip(s: DemoState, input: PlanInput): DemoState {
  const emp = s.employees.find((e) => e.id === s.currentEmployeeId)!;
  const allowance = computeAllowance(s.policy, emp.grade, input.city, input.startDate, input.endDate);
  const needsManager = input.extra > 0;
  const trip: Trip = {
    id: uid("trip"),
    employeeId: emp.id,
    title: input.title,
    city: input.city,
    startDate: input.startDate,
    endDate: input.endDate,
    purpose: input.purpose,
    status: needsManager ? "pending_approval" : "active",
    approval: needsManager ? "manager" : "auto",
    allowance: { ...allowance, total: allowance.total + input.extra },
    card: needsManager ? undefined : simulatedBank.issueCard({ endDate: input.endDate }),
    txns: [],
    drives: [],
    outOfPocket: [],
    bookings: [],
    createdAt: s.clock,
  };
  return { ...s, trips: [trip, ...s.trips] };
}

export function approveTrip(s: DemoState, tripId: string): DemoState {
  return updateTrip(s, tripId, (t) =>
    t.status !== "pending_approval"
      ? t
      : { ...t, status: "active", card: simulatedBank.issueCard({ endDate: t.endDate }) },
  );
}

export interface SwipeInput {
  merchant: string;
  category: MerchantCategory;
  amount: Cents;
}

export function swipe(s: DemoState, input: SwipeInput): { state: DemoState; txn?: Txn } {
  const trip = activeTrip(s);
  if (!trip) return { state: s };
  const req = { ...input, at: s.clock };
  const result = simulatedBank.authorise(s.policy, trip, req);
  const approved = result.approved;
  const needsSlip = approved && input.amount > s.policy.slipThreshold;
  const txn: Txn = {
    id: uid("tx"),
    ...req,
    status: approved ? "approved" : "declined",
    declineReason: result.approved ? undefined : result.reason,
    flags: result.approved ? result.flags : [],
    needsSlip,
    slipAttached: false,
  };
  const next = updateTrip(s, trip.id, (t) => ({ ...t, txns: [...t.txns, txn] }));
  return { state: { ...next, clock: addMinutes(s.clock, 7) }, txn };
}

export function attachSlip(s: DemoState, tripId: string, txnId: string): DemoState {
  return updateTrip(s, tripId, (t) => ({
    ...t,
    txns: t.txns.map((x) => (x.id === txnId ? { ...x, slipAttached: true, vat: Math.round((x.amount * 15) / 115) } : x)),
  }));
}

export interface DriveInput {
  from: string;
  to: string;
  km: number;
  minutes: number;
  purpose: string;
  gps: boolean;
}

export function addDrive(s: DemoState, input: DriveInput): DemoState {
  const trip = activeTrip(s);
  if (!trip) return s;
  const seed = Math.floor(input.km * 1000) + trip.drives.length;
  let a = seed;
  const rand = () => ((a = (a * 9301 + 49297) % 233280) / 233280);
  const endAt = addMinutes(s.clock, input.minutes);
  const next = updateTrip(s, trip.id, (t) => ({
    ...t,
    drives: [
      ...t.drives,
      {
        id: uid("dr"),
        from: input.from,
        to: input.to,
        km: input.km,
        startAt: s.clock,
        endAt,
        purpose: input.purpose,
        gps: input.gps,
        route: input.gps ? makeRoute(rand) : [],
      },
    ],
  }));
  return { ...next, clock: endAt };
}

export function addOutOfPocket(s: DemoState, tripId: string, r: { description: string; category: MerchantCategory; amount: Cents }): DemoState {
  return updateTrip(s, tripId, (t) => ({ ...t, outOfPocket: [...t.outOfPocket, { id: uid("oop"), ...r, at: s.clock }] }));
}

export function closeTrip(s: DemoState, tripId: string): DemoState {
  return updateTrip(s, tripId, (t) => {
    if (t.status !== "active") return t;
    const closed: Trip = { ...t, status: "closed", closedAt: s.clock, card: t.card && { ...t.card, status: "expired" } };
    return { ...closed, claim: buildClaim(s.policy, closed) };
  });
}

export function confirmClaim(s: DemoState, tripId: string): DemoState {
  return updateTrip(s, tripId, (t) => {
    if (t.status !== "closed" || !t.claim) return t;
    const payout = simulatedBank.payout(t.employeeId, t.claim.payable);
    return { ...t, status: "paid", paidAt: s.clock, payoutRef: payout.reference };
  });
}

export function resolveException(
  s: DemoState,
  tripId: string,
  exId: string,
  resolution: NonNullable<TripException["resolution"]>,
): DemoState {
  return updateTrip(s, tripId, (t) => {
    if (!t.claim) return t;
    const ex = t.claim.exceptions.find((e) => e.id === exId);
    if (!ex || ex.status === "resolved") return t;
    let claim = {
      ...t.claim,
      exceptions: t.claim.exceptions.map((e) => (e.id === exId ? { ...e, status: "resolved" as const, resolution } : e)),
    };
    // Approving a no-GPS drive releases its held mileage into the next payout.
    if (ex.rule === "no_gps" && resolution === "approved") {
      const drive = t.drives.find((d) => d.id === ex.refId);
      const extra = drive ? mileagePay(s.policy, drive.km) : { nonTaxable: 0, taxable: 0, total: 0 };
      claim = {
        ...claim,
        held: claim.held - ex.amount,
        payable: claim.payable + ex.amount,
        paidMileage: {
          nonTaxable: claim.paidMileage.nonTaxable + extra.nonTaxable,
          taxable: claim.paidMileage.taxable + extra.taxable,
          total: claim.paidMileage.total + extra.total,
        },
      };
    }
    return { ...t, claim };
  });
}

export function updatePolicy(s: DemoState, patch: Partial<Policy>): DemoState {
  return { ...s, policy: { ...s.policy, ...patch } };
}

export function advanceDay(s: DemoState): DemoState {
  return { ...s, clock: `${addDays(s.clock.slice(0, 10), 1)}T08:00` };
}

export function setClock(s: DemoState, clock: string): DemoState {
  return { ...s, clock };
}
