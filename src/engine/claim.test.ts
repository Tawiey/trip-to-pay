import { describe, it, expect } from "vitest";
import { DEFAULT_POLICY } from "./policy";
import { computeAllowance } from "./allowance";
import { mileagePay } from "./mileage";
import { buildClaim } from "./claim";
import { journalFor, payrollCodes } from "./ledger";
import { toCSV } from "./csv";
import type { Drive, Trip, Txn } from "./types";

const P = DEFAULT_POLICY;

function trip(over: Partial<Trip> = {}): Trip {
  return {
    id: "t1", employeeId: "e1", title: "Durban", city: "Durban",
    startDate: "2026-10-14", endDate: "2026-10-16", purpose: "Client", status: "active", approval: "auto",
    allowance: computeAllowance(P, "B", "Durban", "2026-10-14", "2026-10-16"),
    txns: [], drives: [], outOfPocket: [], bookings: [], createdAt: "2026-10-10T09:00",
    ...over,
  };
}
const txn = (o: Partial<Txn>): Txn => ({
  id: "x", merchant: "M", category: "meals", amount: 1000, at: "2026-10-15T12:00",
  status: "approved", flags: [], needsSlip: false, slipAttached: false, ...o,
});
const drive = (o: Partial<Drive>): Drive => ({
  id: "d", from: "A", to: "B", km: 10, startAt: "2026-10-15T08:00", endAt: "2026-10-15T08:30",
  purpose: "Visit", gps: true, route: [], ...o,
});

describe("mileagePay", () => {
  it("212 km at the SARS rate is R1 049.40, all non-taxable", () => {
    expect(mileagePay(P, 212)).toEqual({ nonTaxable: 104940, taxable: 0, total: 104940 });
  });
  it("company rate above SARS splits excess to taxable 3702", () => {
    expect(mileagePay({ ...P, companyKmRate: 600 }, 100)).toEqual({ nonTaxable: 49500, taxable: 10500, total: 60000 });
  });
  it("company rate below SARS is all non-taxable", () => {
    expect(mileagePay({ ...P, companyKmRate: 400 }, 100)).toEqual({ nonTaxable: 40000, taxable: 0, total: 40000 });
  });
  it("handles fractional km", () => {
    expect(mileagePay(P, 48.2).total).toBe(23859);
  });
});

describe("buildClaim", () => {
  it("deck example: card R2 660, 212 GPS km, parking R90 → pays R1 139.40, 0 exceptions", () => {
    const c = buildClaim(P, trip({
      txns: [txn({ amount: 266000, category: "lodging" })],
      drives: [drive({ km: 212 })],
      outOfPocket: [{ id: "p", description: "Parking", category: "parking", amount: 9000, at: "2026-10-15T10:00" }],
    }));
    expect(c.cardSpend).toBe(266000);
    expect(c.payable).toBe(113940);
    expect(c.exceptions).toEqual([]);
  });
  it("empty trip pays nothing and has no exceptions", () => {
    const c = buildClaim(P, trip());
    expect(c.payable).toBe(0);
    expect(c.held).toBe(0);
    expect(c.exceptions).toEqual([]);
  });
  it("non-GPS drive is held and raises ask_reason", () => {
    const c = buildClaim(P, trip({ drives: [drive({ id: "g", km: 30 }), drive({ id: "m", km: 18, gps: false })] }));
    expect(c.gpsKm).toBe(30);
    expect(c.mileageKm).toBe(48);
    expect(c.payable).toBe(14850);
    expect(c.held).toBe(8910);
    expect(c.exceptions).toMatchObject([{ rule: "no_gps", suggested: "ask_reason", amount: 8910, refId: "m", status: "open" }]);
  });
  it("missing slip raises ask_slip; attached slip does not", () => {
    const c = buildClaim(P, trip({ txns: [
      txn({ id: "a", amount: 38000, needsSlip: true, slipAttached: false }),
      txn({ id: "b", amount: 24500, needsSlip: true, slipAttached: true }),
    ] }));
    expect(c.exceptions).toMatchObject([{ rule: "missing_slip", suggested: "ask_slip", amount: 38000, refId: "a" }]);
  });
  it("over-cap meal flagged in flag mode raises recover for the overage", () => {
    const c = buildClaim(P, trip({ txns: [
      txn({ id: "a", amount: 40000, at: "2026-10-15T12:00" }),
      txn({ id: "b", amount: 33500, at: "2026-10-15T19:00", flags: ["dining_over_cap"] }),
    ] }));
    expect(c.exceptions).toMatchObject([{ rule: "dining_over_cap", suggested: "recover", amount: 14000, refId: "b" }]);
  });
  it("declined txns are not card spend", () => {
    const c = buildClaim(P, trip({ txns: [txn({ status: "declined", amount: 18000, declineReason: "Blocked by policy" })] }));
    expect(c.cardSpend).toBe(0);
  });
});

describe("ledger", () => {
  const closed = (over: Partial<Trip>) => {
    const t = trip({ status: "paid", ...over });
    return { ...t, claim: buildClaim(P, t) };
  };
  const trips = [
    closed({ txns: [txn({ amount: 24500 }), txn({ category: "transport", amount: 38000 })], drives: [drive({ km: 100 })],
      bookings: [{ id: "h", kind: "hotel", title: "Hotel", detail: "", amount: 360000, withinCap: true }] }),
    closed({ id: "t2", outOfPocket: [{ id: "p", description: "Parking", category: "parking", amount: 9000, at: "2026-10-15T10:00" }] }),
    trip({ id: "t3", txns: [txn({ amount: 99999 })] }), // active trip: excluded
  ];
  it("journal balances and posts by category", () => {
    const j = journalFor(trips);
    const dr = j.filter((l) => l.side === "Dr").reduce((s, l) => s + l.amount, 0);
    const cr = j.filter((l) => l.side === "Cr").reduce((s, l) => s + l.amount, 0);
    expect(dr).toBe(cr);
    expect(j.find((l) => l.account === "Meals")?.amount).toBe(24500);
    expect(j.find((l) => l.account === "Accommodation")?.amount).toBe(360000);
    expect(j.find((l) => l.account === "Mileage")?.amount).toBe(49500);
    expect(j.find((l) => l.account === "Card clearing")?.amount).toBe(24500 + 38000 + 360000);
    expect(j.find((l) => l.account === "Reimbursements")?.amount).toBe(49500 + 9000);
  });
  it("payroll codes split mileage 3703/3702 and sum recoveries", () => {
    const t = closed({ drives: [drive({ km: 100 })] });
    t.claim!.exceptions = [{ id: "e", rule: "dining_over_cap", description: "", amount: 14000, suggested: "recover", status: "resolved", resolution: "recovered", refId: "b" }];
    expect(payrollCodes([t])).toEqual({ code3703: 49500, code3702: 0, recoveries: 14000 });
  });
});

describe("toCSV", () => {
  it("escapes commas, quotes and newlines", () => {
    expect(toCSV([{ a: "x,y", b: 'say "hi"', c: 3 }])).toBe('a,b,c\n"x,y","say ""hi""",3');
  });
  it("empty rows give empty string", () => {
    expect(toCSV([])).toBe("");
  });
});
