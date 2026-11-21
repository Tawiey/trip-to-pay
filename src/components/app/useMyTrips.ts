"use client";
import { useDemo } from "@/store/useDemo";
import type { Trip } from "@/engine/types";

/** The current employee's trips, plus the one the app should focus on. */
export function useMyTrips() {
  const trips = useDemo((s) => s.trips);
  const me = useDemo((s) => s.currentEmployeeId);
  const mine = trips.filter((t) => t.employeeId === me);
  const by = (st: Trip["status"]) => mine.filter((t) => t.status === st).sort((a, b) => b.startDate.localeCompare(a.startDate));
  const active = by("active")[0];
  const closed = by("closed")[0];
  const pending = by("pending_approval")[0];
  const paid = by("paid");
  return { mine, active, closed, pending, paid, focus: active ?? closed ?? pending ?? paid[0] };
}
