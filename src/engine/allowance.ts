import type { Allowance, City, Grade, Policy } from "./types";
import { daysBetween } from "./dates";

/** Trip budget from grade, city and dates — computed the moment a trip is planned. */
export function computeAllowance(
  policy: Policy,
  grade: Grade,
  city: City,
  startDate: string,
  endDate: string,
): Allowance {
  const span = daysBetween(startDate, endDate);
  const days = span < 0 ? 0 : span + 1;
  const nights = Math.max(0, days - 1);
  const lodging = nights * policy.hotelCapPerNight[grade][city];
  const meals = days * policy.diningCapPerDay;
  const incidentals = days * policy.incidentalsPerDay;
  const transport = days * policy.transportPerDay;
  const flights = days > 0 && city !== policy.homeCity ? policy.flightEstimate : 0;
  return {
    nights,
    days,
    lodging,
    meals,
    incidentals,
    transport,
    flights,
    total: lodging + meals + incidentals + transport + flights,
  };
}
