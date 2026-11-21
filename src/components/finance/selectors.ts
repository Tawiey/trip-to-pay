import type { Employee, Trip, TripException } from "@/engine/types";
import type { DemoState } from "@/store/actions";
import { daysBetween } from "@/engine/dates";

export const isSettled = (t: Trip) => t.status === "closed" || t.status === "paid";

export interface ExceptionRow {
  ex: TripException;
  trip: Trip;
  employee: Employee;
}

export function exceptionRows(s: DemoState, status: TripException["status"]): ExceptionRow[] {
  const emp = new Map(s.employees.map((e) => [e.id, e]));
  return s.trips
    .filter((t) => t.claim)
    .flatMap((trip) => trip.claim!.exceptions.filter((e) => e.status === status).map((ex) => ({ ex, trip, employee: emp.get(trip.employeeId)! })))
    .sort((a, b) => (b.trip.closedAt ?? "").localeCompare(a.trip.closedAt ?? ""));
}

export function kpis(s: DemoState) {
  const settled = s.trips.filter(isSettled);
  const clean = settled.filter((t) => t.approval === "auto" && (t.claim?.exceptions.length ?? 0) === 0);
  const paid = s.trips.filter((t) => t.status === "paid" && t.closedAt && t.paidAt);
  const sameDay = paid.filter((t) => daysBetween(t.closedAt!.slice(0, 10), t.paidAt!.slice(0, 10)) === 0);
  return {
    closed: settled.length,
    autoPct: settled.length ? Math.round((clean.length / settled.length) * 100) : 0,
    openExceptions: exceptionRows(s, "open").length,
    timeToPay: paid.length === 0 ? "—" : sameDay.length / paid.length >= 0.5 ? "Same day" : "Next day",
  };
}

export const RESOLUTION_LABEL: Record<NonNullable<TripException["resolution"]>, string> = {
  recovered: "Recovered via payroll",
  approved: "Approved once",
  reason_requested: "Reason requested",
  slip_requested: "Slip requested",
};

export const SUGGESTED: Record<TripException["suggested"], { label: string; resolution: NonNullable<TripException["resolution"]> }> = {
  recover: { label: "Recover", resolution: "recovered" },
  ask_reason: { label: "Ask reason", resolution: "reason_requested" },
  approve_once: { label: "Approve once", resolution: "approved" },
  ask_slip: { label: "Ask for slip", resolution: "slip_requested" },
};

export const STATUS_LABEL: Record<Trip["status"], string> = {
  pending_approval: "Awaiting approval",
  active: "Live",
  closed: "Awaiting confirm",
  paid: "Paid",
};
