import { DEFAULT_POLICY } from "@/engine/policy";
import { computeAllowance } from "@/engine/allowance";
import { buildClaim } from "@/engine/claim";
import { addDays } from "@/engine/dates";
import type { Card, City, Drive, Employee, MerchantCategory, Policy, Trip, Txn } from "@/engine/types";

/** Deterministic PRNG so the seed (and SSR) is identical every time. */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A Manhattan-ish route between two points, normalised 0..1, for the mileage map. */
export function makeRoute(rand: () => number): [number, number][] {
  const pts: [number, number][] = [[0.08 + rand() * 0.1, 0.8 + rand() * 0.1]];
  const steps = 3 + Math.floor(rand() * 3);
  for (let i = 1; i <= steps; i++) {
    const [x, y] = pts[pts.length - 1];
    const tx = 0.1 + (0.8 * i) / steps;
    const ty = 0.85 - (0.7 * i) / steps;
    pts.push(i % 2 ? [tx, y] : [x, ty]);
  }
  pts.push([0.88, 0.14]);
  return pts;
}

export const CURRENT_EMPLOYEE_ID = "e-thandi";

export const EMPLOYEES: Employee[] = [
  { id: CURRENT_EMPLOYEE_ID, name: "Thandi Mokoena", grade: "B", department: "Client Services", bankMasked: "FNB ···· 3391" },
  { id: "e-nomsa", name: "Nomsa Dlamini", grade: "B", department: "Sales", bankMasked: "Capitec ···· 1180" },
  { id: "e-pieter", name: "Pieter van Wyk", grade: "C", department: "Field Engineering", bankMasked: "ABSA ···· 9024" },
  { id: "e-sanjay", name: "Sanjay Naidoo", grade: "B", department: "Projects", bankMasked: "Nedbank ···· 4471" },
  { id: "e-lerato", name: "Lerato Khumalo", grade: "A", department: "Executive", bankMasked: "RMB ···· 0007" },
  { id: "e-james", name: "James Botha", grade: "C", department: "Field Engineering", bankMasked: "Standard Bank ···· 6612" },
  { id: "e-ayesha", name: "Ayesha Patel", grade: "B", department: "Finance", bankMasked: "Discovery ···· 2290" },
  { id: "e-sipho", name: "Sipho Ndlovu", grade: "C", department: "Installations", bankMasked: "TymeBank ···· 5583" },
  { id: "e-megan", name: "Megan Fourie", grade: "B", department: "Sales", bankMasked: "FNB ···· 7745" },
  { id: "e-kabelo", name: "Kabelo Molefe", grade: "B", department: "Projects", bankMasked: "Capitec ···· 3308" },
];

export interface DrivePreset {
  id: string;
  from: string;
  to: string;
  km: number;
  minutes: number;
  purpose: string;
}

export const DRIVE_PRESETS: DrivePreset[] = [
  { id: "umhlanga-westville", from: "Hotel, uMhlanga", to: "Client, Westville", km: 22.4, minutes: 26, purpose: "Quarterly review" },
  { id: "westville-pinetown", from: "Client, Westville", to: "Site, Pinetown", km: 11.8, minutes: 18, purpose: "Site inspection" },
  { id: "durban-airport", from: "Hotel, uMhlanga", to: "King Shaka Airport", km: 18.6, minutes: 21, purpose: "Return flight" },
  { id: "office-midrand", from: "Office, Rosebank", to: "Client, Midrand", km: 48.2, minutes: 39, purpose: "Quarterly review" },
];

export interface MerchantPreset {
  id: string;
  merchant: string;
  category: MerchantCategory;
  amount: number; // cents
}

export const MERCHANT_PRESETS: MerchantPreset[] = [
  { id: "spice", merchant: "Spice Route Café", category: "meals", amount: 24500 },
  { id: "taxi", merchant: "Airport taxi", category: "transport", amount: 38000 },
  { id: "dinner", merchant: "Cargo Hold Restaurant", category: "meals", amount: 49500 },
  { id: "bar", merchant: "Late-night bar", category: "alcohol", amount: 18000 },
  { id: "fuel", merchant: "Engen uMhlanga", category: "fuel", amount: 65000 },
  { id: "parking", merchant: "Gateway parking", category: "parking", amount: 3000 },
  { id: "atm", merchant: "ATM withdrawal", category: "cash", amount: 100000 },
  { id: "cinema", merchant: "Ster-Kinekor", category: "entertainment", amount: 22000 },
];

const vat = (amount: number) => Math.round((amount * 15) / 115);

function txn(id: string, merchant: string, category: MerchantCategory, amount: number, at: string, slip = true, policy = DEFAULT_POLICY): Txn {
  const needsSlip = amount > policy.slipThreshold;
  return {
    id, merchant, category, amount, at, status: "approved", flags: [], needsSlip,
    slipAttached: needsSlip && slip, vat: needsSlip && slip ? vat(amount) : undefined,
  };
}

function drive(id: string, from: string, to: string, km: number, startAt: string, minutes: number, purpose: string, rand: () => number, gps = true): Drive {
  const [d, t] = startAt.split("T");
  const [h, m] = t.split(":").map(Number);
  const end = h * 60 + m + minutes;
  const endAt = `${d}T${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  return { id, from, to, km, startAt, endAt, purpose, gps, route: gps ? makeRoute(rand) : [] };
}

function card(last4: string, expiresOn: string, status: Card["status"]): Card {
  return { last4, pan: `5321 0418 7730 ${last4}`, cvv: "482", expiresOn, status };
}

const titleFor = (city: City, purpose: string) => `${city} ${purpose.toLowerCase()}`;

function closedTrip(policy: Policy, t: Omit<Trip, "allowance" | "status" | "claim" | "approval"> & { grade: Employee["grade"] }): Trip {
  const { grade, ...rest } = t;
  const trip: Trip = {
    ...rest,
    approval: "auto",
    status: "paid",
    allowance: computeAllowance(policy, grade, t.city, t.startDate, t.endDate),
    card: rest.card ? { ...rest.card, status: "expired" } : undefined,
  };
  trip.claim = buildClaim(policy, trip);
  return trip;
}

export interface SeedState {
  policy: Policy;
  employees: Employee[];
  trips: Trip[];
  currentEmployeeId: string;
  clock: string;
}

export function makeSeed(): SeedState {
  const policy = DEFAULT_POLICY;
  const rand = mulberry32(20261015);
  const grade = (id: string) => EMPLOYEES.find((e) => e.id === id)!.grade;

  // Thandi's live trip, mid-way through day 2 (mirrors the concept deck)
  const thandi: Trip = {
    id: "trip-durban",
    employeeId: CURRENT_EMPLOYEE_ID,
    title: "Durban client visit",
    city: "Durban",
    startDate: "2026-10-14",
    endDate: "2026-10-16",
    purpose: "Quarterly review with Umhlanga Holdings",
    status: "active",
    approval: "auto",
    allowance: computeAllowance(policy, "B", "Durban", "2026-10-14", "2026-10-16"),
    card: card("4821", "2026-10-16", "active"),
    bookings: [
      { id: "bk-flight", kind: "flight", title: "FlySafair FA 151", detail: "JNB → DUR · 14 Oct 07:05 · return 16 Oct 17:40", amount: 215000, withinCap: true },
      { id: "bk-hotel", kind: "hotel", title: "Protea Hotel uMhlanga", detail: "2 nights · 14–16 Oct · cap R 1 800/night", amount: 340000, withinCap: true },
    ],
    txns: [
      txn("tx-taxi", "Airport taxi", "transport", 38000, "2026-10-14T09:40"),
      txn("tx-dinner", "Cargo Hold Restaurant", "meals", 41200, "2026-10-14T19:35"),
      {
        id: "tx-bar", merchant: "Late-night bar", category: "alcohol", amount: 18000, at: "2026-10-14T23:10",
        status: "declined", declineReason: "Blocked by policy", flags: [], needsSlip: false, slipAttached: false,
      },
      txn("tx-breakfast", "Vida e Caffè", "meals", 4800, "2026-10-15T07:50"),
      txn("tx-spice", "Spice Route Café", "meals", 24500, "2026-10-15T13:02", false),
    ],
    drives: [
      drive("dr-1", "Home, Randburg", "OR Tambo Airport", 38.6, "2026-10-14T05:20", 34, "Outbound flight", rand),
      drive("dr-2", "Hotel, uMhlanga", "Client, Westville", 22.4, "2026-10-15T08:12", 26, "Quarterly review", rand),
    ],
    outOfPocket: [
      { id: "oop-parking", description: "Gateway parking (cash)", category: "parking", amount: 3000, at: "2026-10-15T08:40" },
    ],
    createdAt: "2026-10-09T10:15",
  };

  const trips: Trip[] = [thandi];

  // Exceptions straight from the deck's finance console
  trips.push(closedTrip(policy, {
    id: "trip-nomsa-cpt", employeeId: "e-nomsa", grade: grade("e-nomsa"), title: "Cape Town sales summit", city: "Cape Town",
    startDate: "2026-10-03", endDate: "2026-10-05", purpose: "Sales summit", card: card("2210", "2026-10-05", "expired"),
    txns: [
      txn("n1", "Kloof Street House", "meals", 52000, "2026-10-04T12:30"),
      { ...txn("n2", "Willoughby & Co", "meals", 21500, "2026-10-04T19:40"), flags: ["dining_over_cap"] },
      txn("n3", "Uber", "transport", 18600, "2026-10-04T08:10"),
    ],
    drives: [], outOfPocket: [],
    bookings: [{ id: "n-hotel", kind: "hotel", title: "Radisson RED V&A", detail: "2 nights", amount: 420000, withinCap: true }],
    createdAt: "2026-09-28T09:00", closedAt: "2026-10-05T18:20", paidAt: "2026-10-05T18:21", payoutRef: "PS-7KQ2M9XA",
  }));
  trips.push(closedTrip(policy, {
    id: "trip-pieter-pkw", employeeId: "e-pieter", grade: grade("e-pieter"), title: "Polokwane site visit", city: "Polokwane",
    startDate: "2026-10-07", endDate: "2026-10-07", purpose: "Substation inspection", card: card("7719", "2026-10-07", "expired"),
    txns: [txn("p1", "Wimpy N1", "meals", 13800, "2026-10-07T12:15")],
    drives: [
      drive("p-d1", "Office, Rosebank", "Site, Polokwane", 318.4, "2026-10-07T05:30", 205, "Substation inspection", rand),
      drive("p-d2", "Site, Polokwane", "Supplier, Seshego", 18, "2026-10-07T13:00", 20, "Parts collection", rand, false),
    ],
    outOfPocket: [], bookings: [],
    createdAt: "2026-10-02T11:00", closedAt: "2026-10-07T19:05", paidAt: "2026-10-07T19:06", payoutRef: "PS-H3N8WQ4R",
  }));
  trips.push(closedTrip(policy, {
    id: "trip-sanjay-gqe", employeeId: "e-sanjay", grade: grade("e-sanjay"), title: "Gqeberha project kick-off", city: "Gqeberha",
    startDate: "2026-10-08", endDate: "2026-10-09", purpose: "Project kick-off", card: card("5502", "2026-10-09", "expired"),
    txns: [txn("s1", "Fushin Sushi", "meals", 38900, "2026-10-08T19:10"), txn("s2", "Bolt", "transport", 9600, "2026-10-09T07:55")],
    drives: [], outOfPocket: [],
    bookings: [{ id: "s-hotel", kind: "hotel", title: "The Boardwalk Hotel", detail: "1 night · cap R 1 500", amount: 191000, withinCap: false, overBy: 41000 }],
    createdAt: "2026-10-01T15:30", closedAt: "2026-10-09T17:45", paidAt: "2026-10-09T17:46", payoutRef: "PS-ZP5V2C8T",
  }));

  // A month of routine, fully automatic trips
  const cities: City[] = ["Cape Town", "Durban", "Pretoria", "Gqeberha", "Bloemfontein", "Johannesburg", "Polokwane"];
  const others = EMPLOYEES.filter((e) => e.id !== CURRENT_EMPLOYEE_ID);
  const eateries = ["Mugg & Bean", "Tashas", "Ocean Basket", "Nando's", "Spur", "Col'Cacchio", "Seattle Coffee Co."];
  for (let i = 0; i < 24; i++) {
    const emp = others[Math.floor(rand() * others.length)];
    const city = cities[Math.floor(rand() * cities.length)];
    const start = addDays("2026-09-01", Math.floor(rand() * 40));
    const days = 1 + Math.floor(rand() * 3);
    const end = addDays(start, days - 1);
    const txns: Txn[] = [];
    for (let d = 0; d < days; d++) {
      const day = addDays(start, d);
      txns.push(txn(`r${i}-m${d}`, eateries[Math.floor(rand() * eateries.length)], "meals", 9000 + Math.floor(rand() * 30) * 1000, `${day}T12:${String(10 + d).padStart(2, "0")}`));
      if (rand() > 0.5) txns.push(txn(`r${i}-t${d}`, rand() > 0.5 ? "Uber" : "Bolt", "transport", 6000 + Math.floor(rand() * 20) * 1000, `${day}T08:${String(20 + d).padStart(2, "0")}`));
    }
    const drives: Drive[] = [];
    const nDrives = Math.floor(rand() * 4);
    for (let k = 0; k < nDrives; k++) {
      drives.push(drive(`r${i}-d${k}`, "Office", `Client ${k + 1}`, Math.round((8 + rand() * 60) * 10) / 10, `${start}T${String(9 + k).padStart(2, "0")}:05`, 30, "Client meeting", rand));
    }
    const away = city !== policy.homeCity;
    const nights = days - 1;
    const cap = policy.hotelCapPerNight[emp.grade][city];
    trips.push(closedTrip(policy, {
      id: `trip-r${i}`, employeeId: emp.id, grade: emp.grade, title: titleFor(city, rand() > 0.5 ? "client visit" : "site visit"), city,
      startDate: start, endDate: end, purpose: "Client work", card: card(String(1000 + Math.floor(rand() * 8999)), end, "expired"),
      txns, drives, outOfPocket: [],
      bookings: [
        ...(away ? [{ id: `r${i}-f`, kind: "flight" as const, title: "Airlink", detail: `JNB ⇄ ${city}`, amount: 180000 + Math.floor(rand() * 10) * 5000, withinCap: true }] : []),
        ...(nights > 0 ? [{ id: `r${i}-h`, kind: "hotel" as const, title: "City Lodge", detail: `${nights} night${nights > 1 ? "s" : ""}`, amount: nights * Math.round(cap * 0.85), withinCap: true }] : []),
      ],
      createdAt: `${addDays(start, -5)}T10:00`, closedAt: `${end}T18:00`, paidAt: `${end}T18:01`, payoutRef: `PS-SEED${String(i).padStart(4, "0")}`,
    }));
  }

  // One trip waiting for a manager (over-policy request)
  const leratoAllowance = computeAllowance(policy, "A", "Cape Town", "2026-10-20", "2026-10-23");
  trips.push({
    id: "trip-lerato-cpt", employeeId: "e-lerato", title: "Cape Town investor roadshow", city: "Cape Town",
    startDate: "2026-10-20", endDate: "2026-10-23", purpose: "Investor roadshow — conference hotel above cap",
    status: "pending_approval", approval: "manager",
    allowance: { ...leratoAllowance, total: leratoAllowance.total + 120000 },
    txns: [], drives: [], outOfPocket: [], bookings: [], createdAt: "2026-10-13T16:40",
  });

  return { policy, employees: EMPLOYEES, trips, currentEmployeeId: CURRENT_EMPLOYEE_ID, clock: "2026-10-15T14:00" };
}
