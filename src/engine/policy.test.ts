import { describe, it, expect } from "vitest";
import { DEFAULT_POLICY } from "./policy";
import { computeAllowance } from "./allowance";
import { authorise, tripSpend } from "./authorise";
import type { Trip } from "./types";

function trip(over: Partial<Trip> = {}): Trip {
  const allowance = computeAllowance(DEFAULT_POLICY, "B", "Durban", "2026-10-14", "2026-10-16");
  return {
    id: "t1",
    employeeId: "e1",
    title: "Durban client visit",
    city: "Durban",
    startDate: "2026-10-14",
    endDate: "2026-10-16",
    purpose: "Client visit",
    status: "active",
    approval: "auto",
    allowance,
    card: { last4: "4821", pan: "5300 0000 0000 4821", cvv: "123", expiresOn: "2026-10-16", status: "active" },
    txns: [],
    drives: [],
    outOfPocket: [],
    bookings: [],
    createdAt: "2026-10-10T09:00",
    ...over,
  };
}

const swipe = (category: any, amount: number, at = "2026-10-15T13:02", merchant = "Merchant") => ({
  merchant,
  category,
  amount,
  at,
});

describe("DEFAULT_POLICY", () => {
  it("uses SARS 2026/27 figures", () => {
    expect(DEFAULT_POLICY.diningCapPerDay).toBe(59500);
    expect(DEFAULT_POLICY.companyKmRate).toBe(495);
    expect(DEFAULT_POLICY.diningOverCapMode).toBe("decline");
    expect(DEFAULT_POLICY.slipThreshold).toBe(5000);
    expect(DEFAULT_POLICY.blockedCategories).toEqual(["alcohol", "entertainment", "cash"]);
  });
});

describe("computeAllowance", () => {
  it("grade B Durban 14–16 Oct: 2 nights, 3 days", () => {
    const a = computeAllowance(DEFAULT_POLICY, "B", "Durban", "2026-10-14", "2026-10-16");
    expect(a.nights).toBe(2);
    expect(a.days).toBe(3);
    expect(a.meals).toBe(3 * 59500);
    expect(a.lodging).toBe(2 * DEFAULT_POLICY.hotelCapPerNight.B.Durban);
    expect(a.flights).toBe(DEFAULT_POLICY.flightEstimate);
    expect(a.total).toBe(a.lodging + a.meals + a.incidentals + a.transport + a.flights);
  });
  it("same-day trip in home city: 0 nights, 1 day, no flights", () => {
    const a = computeAllowance(DEFAULT_POLICY, "B", "Johannesburg", "2026-10-14", "2026-10-14");
    expect(a.nights).toBe(0);
    expect(a.days).toBe(1);
    expect(a.flights).toBe(0);
  });
  it("end before start yields zero allowance", () => {
    const a = computeAllowance(DEFAULT_POLICY, "B", "Durban", "2026-10-16", "2026-10-14");
    expect(a.days).toBe(0);
    expect(a.total).toBe(0);
  });
});

describe("authorise", () => {
  it("approves an in-policy meal", () => {
    expect(authorise(DEFAULT_POLICY, trip(), swipe("meals", 24500))).toEqual({ approved: true, flags: [] });
  });
  it("declines blocked categories", () => {
    expect(authorise(DEFAULT_POLICY, trip(), swipe("alcohol", 18000))).toEqual({
      approved: false,
      reason: "Blocked by policy",
    });
  });
  it("declines a second meal that crosses the daily cap", () => {
    const t = trip({
      txns: [
        { id: "x", merchant: "Café", category: "meals", amount: 24500, at: "2026-10-15T09:00", status: "approved", flags: [], needsSlip: true, slipAttached: false },
      ],
    });
    expect(authorise(DEFAULT_POLICY, t, swipe("meals", 40000, "2026-10-15T19:00"))).toEqual({
      approved: false,
      reason: "Over daily dining cap",
    });
    // A different day has its own cap
    expect(authorise(DEFAULT_POLICY, t, swipe("meals", 40000, "2026-10-16T19:00")).approved).toBe(true);
  });
  it("in flag mode approves over-cap meals with a flag", () => {
    const p = { ...DEFAULT_POLICY, diningOverCapMode: "flag" as const };
    expect(authorise(p, trip(), swipe("meals", 73500))).toEqual({ approved: true, flags: ["dining_over_cap"] });
  });
  it("declines spend above remaining trip budget", () => {
    const t = trip();
    expect(authorise(DEFAULT_POLICY, t, swipe("transport", t.allowance.total + 1))).toEqual({
      approved: false,
      reason: "Over trip budget",
    });
  });
  it("declines outside trip dates or after close", () => {
    expect(authorise(DEFAULT_POLICY, trip(), swipe("meals", 1000, "2026-10-17T08:00"))).toEqual({
      approved: false,
      reason: "Card expired",
    });
    expect(authorise(DEFAULT_POLICY, trip({ status: "closed" }), swipe("meals", 1000))).toEqual({
      approved: false,
      reason: "Card expired",
    });
  });
  it("tripSpend counts approved txns and bookings only", () => {
    const t = trip({
      txns: [
        { id: "a", merchant: "A", category: "meals", amount: 1000, at: "2026-10-15T09:00", status: "approved", flags: [], needsSlip: false, slipAttached: false },
        { id: "b", merchant: "B", category: "alcohol", amount: 5000, at: "2026-10-15T23:00", status: "declined", declineReason: "Blocked by policy", flags: [], needsSlip: false, slipAttached: false },
      ],
      bookings: [{ id: "h", kind: "hotel", title: "Hotel", detail: "", amount: 300000, withinCap: true }],
    });
    expect(tripSpend(t)).toBe(301000);
  });
});
