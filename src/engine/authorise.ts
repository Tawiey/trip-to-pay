import type { AuthResult, ExceptionRule, Policy, SwipeRequest, Trip } from "./types";
import type { Cents } from "./money";
import { dayOf } from "./dates";

/** Card + booking spend counted against the trip budget. */
export function tripSpend(trip: Trip): Cents {
  const card = trip.txns.filter((t) => t.status === "approved").reduce((s, t) => s + t.amount, 0);
  const booked = trip.bookings.reduce((s, b) => s + b.amount, 0);
  return card + booked;
}

export function remainingBudget(trip: Trip): Cents {
  return trip.allowance.total - tripSpend(trip);
}

export function diningSpentOn(trip: Trip, day: string): Cents {
  return trip.txns
    .filter((t) => t.status === "approved" && t.category === "meals" && dayOf(t.at) === day)
    .reduce((s, t) => s + t.amount, 0);
}

/**
 * Just-in-time authorisation: the card network asks this before approving a swipe,
 * so policy is enforced at the till rather than weeks later.
 */
export function authorise(policy: Policy, trip: Trip, req: SwipeRequest): AuthResult {
  const day = dayOf(req.at);
  if (
    trip.status !== "active" ||
    !trip.card ||
    trip.card.status !== "active" ||
    day < trip.startDate ||
    day > trip.endDate
  ) {
    return { approved: false, reason: "Card expired" };
  }
  if (policy.blockedCategories.includes(req.category)) {
    return { approved: false, reason: "Blocked by policy" };
  }
  if (req.amount > remainingBudget(trip)) {
    return { approved: false, reason: "Over trip budget" };
  }
  const flags: ExceptionRule[] = [];
  if (req.category === "meals" && diningSpentOn(trip, day) + req.amount > policy.diningCapPerDay) {
    if (policy.diningOverCapMode === "decline") {
      return { approved: false, reason: "Over daily dining cap" };
    }
    flags.push("dining_over_cap");
  }
  return { approved: true, flags };
}
