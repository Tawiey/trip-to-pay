import { describe, it, expect } from "vitest";
import { makeSeed, CURRENT_EMPLOYEE_ID } from "./seed";
import * as A from "./actions";

const seed = () => makeSeed();
const thandiTrip = (s: ReturnType<typeof seed>) => s.trips.find((t) => t.id === "trip-durban")!;

describe("seed", () => {
  it("is deterministic and has the live Durban trip", () => {
    expect(JSON.stringify(seed())).toBe(JSON.stringify(seed()));
    expect(thandiTrip(seed()).status).toBe("active");
    expect(seed().trips.filter((t) => t.status === "paid").length).toBeGreaterThanOrEqual(25);
  });
  it("closed seed trips carry the deck's three exceptions", () => {
    const rules = seed().trips.flatMap((t) => t.claim?.exceptions ?? []).map((e) => e.rule).sort();
    expect(rules).toEqual(["dining_over_cap", "no_gps", "over_hotel_cap"]);
  });
});

describe("actions", () => {
  it("swipe records approved and declined txns and advances the clock", () => {
    let s = seed();
    const r1 = A.swipe(s, { merchant: "Late-night bar", category: "alcohol", amount: 18000 });
    expect(r1.txn?.status).toBe("declined");
    expect(r1.txn?.declineReason).toBe("Blocked by policy");
    s = r1.state;
    const r2 = A.swipe(s, { merchant: "Uber", category: "transport", amount: 9000 });
    expect(r2.txn?.status).toBe("approved");
    expect(r2.txn?.needsSlip).toBe(true);
    expect(r2.state.clock > s.clock).toBe(true);
    expect(thandiTrip(r2.state).txns.length).toBe(thandiTrip(seed()).txns.length + 2);
  });
  it("swipe with no active trip returns no txn", () => {
    const s = { ...seed(), trips: seed().trips.filter((t) => t.employeeId !== CURRENT_EMPLOYEE_ID) };
    expect(A.swipe(s, { merchant: "X", category: "meals", amount: 100 }).txn).toBeUndefined();
  });
  it("planTrip auto-approves in policy and issues a card; extra budget needs a manager", () => {
    const base = { ...seed(), trips: seed().trips.filter((t) => t.employeeId !== CURRENT_EMPLOYEE_ID) };
    const a = A.planTrip(base, { title: "Pretoria", city: "Pretoria", startDate: "2026-10-15", endDate: "2026-10-16", purpose: "Client", extra: 0 });
    const t = a.trips.find((x) => x.title === "Pretoria")!;
    expect(t.status).toBe("active");
    expect(t.card?.status).toBe("active");
    const b = A.planTrip(base, { title: "CPT", city: "Cape Town", startDate: "2026-10-15", endDate: "2026-10-16", purpose: "Expo", extra: 50000 });
    const u = b.trips.find((x) => x.title === "CPT")!;
    expect(u.status).toBe("pending_approval");
    expect(u.card).toBeUndefined();
    const c = A.approveTrip(b, u.id);
    const v = c.trips.find((x) => x.id === u.id)!;
    expect(v.status).toBe("active");
    expect(v.card).toBeDefined();
    expect(v.allowance.total).toBe(u.allowance.total);
  });
  it("closeTrip builds the claim and expires the card; confirm pays out", () => {
    const s = A.closeTrip(seed(), "trip-durban");
    const t = thandiTrip(s);
    expect(t.status).toBe("closed");
    expect(t.card?.status).toBe("expired");
    expect(t.claim).toBeDefined();
    const p = A.confirmClaim(s, "trip-durban");
    const q = thandiTrip(p);
    expect(q.status).toBe("paid");
    expect(q.payoutRef).toMatch(/^PS-/);
  });
  it("attachSlip captures 15% inclusive VAT", () => {
    const s = A.attachSlip(seed(), "trip-durban", "tx-spice");
    const x = thandiTrip(s).txns.find((t) => t.id === "tx-spice")!;
    expect(x.slipAttached).toBe(true);
    expect(x.vat).toBe(3196);
  });
  it("approving a no-GPS exception releases the held mileage", () => {
    const s = seed();
    const trip = s.trips.find((t) => t.id === "trip-pieter-pkw")!;
    const ex = trip.claim!.exceptions[0];
    const before = trip.claim!.payable;
    const r = A.resolveException(s, trip.id, ex.id, "approved");
    const t2 = r.trips.find((t) => t.id === trip.id)!;
    expect(t2.claim!.held).toBe(0);
    expect(t2.claim!.payable).toBe(before + ex.amount);
    expect(t2.claim!.exceptions[0]).toMatchObject({ status: "resolved", resolution: "approved" });
  });
  it("advanceDay moves to 08:00 next day; simulateDrive adds a GPS drive", () => {
    const s = A.advanceDay(seed());
    expect(s.clock).toBe("2026-10-16T08:00");
    const d = A.addDrive(s, { from: "A", to: "B", km: 12.3, minutes: 15, purpose: "Visit", gps: true });
    const drive = thandiTrip(d).drives.at(-1)!;
    expect(drive).toMatchObject({ km: 12.3, gps: true, startAt: "2026-10-16T08:00", endAt: "2026-10-16T08:15" });
    expect(drive.route.length).toBeGreaterThan(2);
  });
});
