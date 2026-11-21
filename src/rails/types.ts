import type { AuthResult, Card, Policy, SwipeRequest, Trip } from "@/engine/types";
import type { Cents } from "@/engine/money";

export interface Payout {
  reference: string;
  method: "PayShap" | "EFT";
  amount: Cents;
  simulated: boolean;
}

/**
 * Everything that touches regulated money goes through this interface.
 * Today it is simulated; a licensed partner (BIN sponsor / issuer processor,
 * PayShap payouts) implements the same contract later.
 */
export interface BankRails {
  issueCard(trip: Pick<Trip, "endDate">): Card;
  /** Called by the card network at the till (just-in-time authorisation). */
  authorise(policy: Policy, trip: Trip, req: SwipeRequest): AuthResult;
  payout(employeeId: string, amount: Cents): Payout;
}
