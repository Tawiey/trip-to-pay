import type { City, Grade, Policy } from "./types";
import { CITIES } from "./types";
import type { Cents } from "./money";

/** SARS 2026/27 (Notices 7182 & 7174). Reloaded each tax year. */
export const SARS_KM_RATE: Cents = 495;
export const SARS_DAILY_MEALS: Cents = 59500;

const GRADE_B_HOTEL: Record<City, Cents> = {
  Johannesburg: 200000,
  Pretoria: 170000,
  "Cape Town": 220000,
  Durban: 180000,
  Gqeberha: 150000,
  Polokwane: 140000,
  Bloemfontein: 140000,
};

function scaled(factor: number): Record<City, Cents> {
  return Object.fromEntries(
    CITIES.map((c) => [c, Math.round((GRADE_B_HOTEL[c] * factor) / 5000) * 5000]),
  ) as Record<City, Cents>;
}

export const DEFAULT_POLICY: Policy = {
  diningCapPerDay: SARS_DAILY_MEALS,
  diningOverCapMode: "decline",
  companyKmRate: SARS_KM_RATE,
  blockedCategories: ["alcohol", "entertainment", "cash"],
  hotelCapPerNight: { A: scaled(1.35), B: GRADE_B_HOTEL, C: scaled(0.8) } satisfies Record<Grade, Record<City, Cents>>,
  incidentalsPerDay: 15000,
  transportPerDay: 40000,
  flightEstimate: 250000,
  homeCity: "Johannesburg",
  slipThreshold: 5000,
};
