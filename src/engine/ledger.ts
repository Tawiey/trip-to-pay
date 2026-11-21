import type { MerchantCategory, Trip } from "./types";
import type { Cents } from "./money";

export interface JournalLine {
  account: string;
  side: "Dr" | "Cr";
  amount: Cents;
}

const ACCOUNT: Record<MerchantCategory, string> = {
  meals: "Meals",
  transport: "Travel",
  fuel: "Travel",
  parking: "Travel",
  lodging: "Accommodation",
  incidentals: "Incidentals",
  alcohol: "Other",
  entertainment: "Other",
  cash: "Other",
};

const settled = (trips: Trip[]) =>
  trips.filter((t) => t.claim && (t.status === "closed" || t.status === "paid"));

/** Journal posted automatically for closed trips: Dr expense accounts, Cr card clearing / reimbursements. */
export function journalFor(trips: Trip[]): JournalLine[] {
  const dr = new Map<string, Cents>();
  const add = (acc: string, amt: Cents) => dr.set(acc, (dr.get(acc) ?? 0) + amt);
  let cardClearing = 0;
  let reimbursements = 0;
  for (const t of settled(trips)) {
    for (const x of t.txns) if (x.status === "approved") add(ACCOUNT[x.category], x.amount);
    for (const b of t.bookings) add(b.kind === "hotel" ? "Accommodation" : "Travel", b.amount);
    for (const r of t.outOfPocket) add(ACCOUNT[r.category], r.amount);
    if (t.claim!.paidMileage.total) add("Mileage", t.claim!.paidMileage.total);
    cardClearing += t.claim!.cardSpend;
    reimbursements += t.claim!.payable;
  }
  const order = ["Meals", "Travel", "Accommodation", "Incidentals", "Mileage", "Other"];
  const lines: JournalLine[] = order
    .filter((a) => dr.get(a))
    .map((account) => ({ account, side: "Dr", amount: dr.get(account)! }));
  if (cardClearing) lines.push({ account: "Card clearing", side: "Cr", amount: cardClearing });
  if (reimbursements) lines.push({ account: "Reimbursements", side: "Cr", amount: reimbursements });
  return lines;
}

export function payrollCodes(trips: Trip[]): { code3703: Cents; code3702: Cents; recoveries: Cents } {
  let code3703 = 0;
  let code3702 = 0;
  let recoveries = 0;
  for (const t of settled(trips)) {
    code3703 += t.claim!.paidMileage.nonTaxable;
    code3702 += t.claim!.paidMileage.taxable;
    for (const e of t.claim!.exceptions) if (e.resolution === "recovered") recoveries += e.amount;
  }
  return { code3703, code3702, recoveries };
}
