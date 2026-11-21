import type { Cents } from "./money";

export type Grade = "A" | "B" | "C";

export const CITIES = [
  "Johannesburg",
  "Pretoria",
  "Cape Town",
  "Durban",
  "Gqeberha",
  "Polokwane",
  "Bloemfontein",
] as const;
export type City = (typeof CITIES)[number];

export type MerchantCategory =
  | "meals"
  | "transport"
  | "lodging"
  | "fuel"
  | "parking"
  | "incidentals"
  | "alcohol"
  | "entertainment"
  | "cash";

export const CATEGORY_LABEL: Record<MerchantCategory, string> = {
  meals: "Meals",
  transport: "Transport",
  lodging: "Accommodation",
  fuel: "Fuel",
  parking: "Parking",
  incidentals: "Incidentals",
  alcohol: "Alcohol & bars",
  entertainment: "Entertainment",
  cash: "Cash withdrawal",
};

export interface Policy {
  /** Daily dining cap enforced on the card. SARS deemed local default R595. */
  diningCapPerDay: Cents;
  /** What happens when a meal swipe would exceed the daily cap. */
  diningOverCapMode: "decline" | "flag";
  /** Rate the company pays per GPS km. Above SARS rate the excess is taxable. */
  companyKmRate: Cents;
  blockedCategories: MerchantCategory[];
  hotelCapPerNight: Record<Grade, Record<City, Cents>>;
  incidentalsPerDay: Cents;
  transportPerDay: Cents;
  /** Return flight estimate for trips away from the home city. */
  flightEstimate: Cents;
  homeCity: City;
  /** Approved card spend above this needs a slip (VAT invoice). */
  slipThreshold: Cents;
}

export type ExceptionRule =
  | "dining_over_cap"
  | "no_gps"
  | "missing_slip"
  | "over_hotel_cap";

export type SuggestedAction =
  | "recover"
  | "ask_reason"
  | "approve_once"
  | "ask_slip";

export interface TripException {
  id: string;
  rule: ExceptionRule;
  description: string;
  amount: Cents;
  suggested: SuggestedAction;
  status: "open" | "resolved";
  resolution?: "recovered" | "approved" | "reason_requested" | "slip_requested";
  /** Id of the txn/drive the exception is about. */
  refId: string;
}

export interface Txn {
  id: string;
  merchant: string;
  category: MerchantCategory;
  amount: Cents;
  /** ISO datetime, local time without zone, e.g. 2026-10-15T13:02 */
  at: string;
  status: "approved" | "declined";
  declineReason?: string;
  flags: ExceptionRule[];
  needsSlip: boolean;
  slipAttached: boolean;
  /** VAT portion captured from slip (15% inclusive). */
  vat?: Cents;
}

export interface Drive {
  id: string;
  from: string;
  to: string;
  km: number;
  startAt: string;
  endAt: string;
  purpose: string;
  gps: boolean;
  /** Normalised 0..1 route points for the map. */
  route: [number, number][];
}

/** Something the employee paid personally, e.g. a parking slip. */
export interface OutOfPocket {
  id: string;
  description: string;
  category: MerchantCategory;
  amount: Cents;
  at: string;
}

export interface Booking {
  id: string;
  kind: "flight" | "hotel";
  title: string;
  detail: string;
  amount: Cents;
  withinCap: boolean;
}

export interface Card {
  last4: string;
  pan: string;
  cvv: string;
  expiresOn: string;
  status: "active" | "expired";
}

export interface Allowance {
  nights: number;
  days: number;
  lodging: Cents;
  meals: Cents;
  incidentals: Cents;
  transport: Cents;
  flights: Cents;
  total: Cents;
}

export type TripStatus = "pending_approval" | "active" | "closed" | "paid";

export interface MileagePay {
  /** Up to the SARS rate — payroll code 3703 */
  nonTaxable: Cents;
  /** Excess over the SARS rate — payroll code 3702 (PAYE) */
  taxable: Cents;
  total: Cents;
}

export interface Claim {
  /** Already settled on the card — never paid out again. */
  cardSpend: Cents;
  mileageKm: number;
  gpsKm: number;
  /** Mileage paid now (GPS-verified drives). */
  paidMileage: MileagePay;
  /** Mileage held until finance clears an exception (non-GPS drives). */
  held: Cents;
  outOfPocket: Cents;
  /** Paid to the employee now: paidMileage.total + outOfPocket. */
  payable: Cents;
  exceptions: TripException[];
}

export interface Trip {
  id: string;
  employeeId: string;
  title: string;
  city: City;
  /** YYYY-MM-DD inclusive */
  startDate: string;
  endDate: string;
  purpose: string;
  status: TripStatus;
  approval: "auto" | "manager";
  allowance: Allowance;
  card?: Card;
  txns: Txn[];
  drives: Drive[];
  outOfPocket: OutOfPocket[];
  bookings: Booking[];
  claim?: Claim;
  createdAt: string;
  closedAt?: string;
  paidAt?: string;
  payoutRef?: string;
}

export interface Employee {
  id: string;
  name: string;
  grade: Grade;
  department: string;
  bankMasked: string;
}

export interface SwipeRequest {
  merchant: string;
  category: MerchantCategory;
  amount: Cents;
  at: string;
}

export type AuthResult =
  | { approved: true; flags: ExceptionRule[] }
  | { approved: false; reason: string };
