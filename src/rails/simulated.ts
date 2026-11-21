import { authorise } from "@/engine/authorise";
import type { BankRails } from "./types";

const digits = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const simulatedBank: BankRails = {
  issueCard(trip) {
    const last4 = digits(4);
    return {
      last4,
      pan: `5321 ${digits(4)} ${digits(4)} ${last4}`,
      cvv: digits(3),
      expiresOn: trip.endDate,
      status: "active",
    };
  },
  authorise,
  payout(_employeeId, amount) {
    const ref = Array.from({ length: 8 }, () => ALNUM[Math.floor(Math.random() * ALNUM.length)]).join("");
    return { reference: `PS-${ref}`, method: "PayShap", amount, simulated: true };
  },
};
