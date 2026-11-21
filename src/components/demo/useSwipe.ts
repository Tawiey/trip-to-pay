"use client";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { activeTrip } from "@/store/actions";
import { diningSpentOn } from "@/engine/authorise";
import { formatZAR } from "@/engine/money";
import type { SwipeInput } from "@/store/actions";

/** Swipes the active trip card and announces the authorisation result. */
export function useSwipe() {
  const swipe = useDemo((s) => s.swipe);
  const push = useToast((s) => s.push);
  return (input: SwipeInput) => {
    const txn = swipe(input);
    if (!txn) {
      push({ tone: "info", title: "No active trip", body: "Plan a trip in the employee app to get a card." });
      return;
    }
    if (txn.status === "declined") {
      push({ tone: "warn", title: `Declined · ${txn.merchant}`, body: `${txn.declineReason} — ${formatZAR(txn.amount)} blocked at the till.` });
      return;
    }
    const s = useDemo.getState();
    const trip = activeTrip(s);
    const flagged = txn.flags.includes("dining_over_cap");
    const dining = trip && txn.category === "meals" ? ` Dining today ${formatZAR(diningSpentOn(trip, txn.at.slice(0, 10)), { whole: true })} / ${formatZAR(s.policy.diningCapPerDay, { whole: true })}.` : "";
    push({
      tone: flagged ? "warn" : "ok",
      title: `${flagged ? "Approved · flagged" : "Approved"} · ${txn.merchant} ${formatZAR(txn.amount)}`,
      body: (txn.needsSlip ? "Slip requested for VAT." : "No slip needed.") + dining,
    });
  };
}
