"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Policy, Txn } from "@/engine/types";
import * as A from "./actions";
import { makeSeed } from "./seed";
import { sanitizeStored } from "./storage";

export const STORAGE_KEY = "trip-to-pay-demo-v1";
const VERSION = 1;

interface Actions {
  planTrip(input: A.PlanInput): void;
  approveTrip(tripId: string): void;
  swipe(input: A.SwipeInput): Txn | undefined;
  attachSlip(tripId: string, txnId: string): void;
  addDrive(input: A.DriveInput): void;
  addOutOfPocket(tripId: string, r: Parameters<typeof A.addOutOfPocket>[2]): void;
  closeTrip(tripId: string): void;
  confirmClaim(tripId: string): void;
  resolveException(tripId: string, exId: string, resolution: Parameters<typeof A.resolveException>[3]): void;
  updatePolicy(patch: Partial<Policy>): void;
  advanceDay(): void;
  setClock(clock: string): void;
  reset(): void;
}

export type DemoStore = A.DemoState & Actions;

/** localStorage that never throws (private mode, blocked storage). */
const safeStorage = createJSONStorage(() => ({
  getItem: (k: string) => {
    try {
      return sanitizeStored(localStorage.getItem(k));
    } catch {
      return null;
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
}));

function isValid(s: unknown): s is A.DemoState {
  const x = s as A.DemoState;
  return !!x && Array.isArray(x.trips) && Array.isArray(x.employees) && !!x.policy && typeof x.clock === "string";
}

export const useDemo = create<DemoStore>()(
  persist(
    (set, get) => {
      const apply = (fn: (s: A.DemoState) => A.DemoState) => set((s) => fn(s));
      return {
        ...makeSeed(),
        planTrip: (input) => apply((s) => A.planTrip(s, input)),
        approveTrip: (id) => apply((s) => A.approveTrip(s, id)),
        swipe: (input) => {
          const r = A.swipe(get(), input);
          set(r.state);
          return r.txn;
        },
        attachSlip: (tripId, txnId) => apply((s) => A.attachSlip(s, tripId, txnId)),
        addDrive: (input) => apply((s) => A.addDrive(s, input)),
        addOutOfPocket: (tripId, r) => apply((s) => A.addOutOfPocket(s, tripId, r)),
        closeTrip: (id) => apply((s) => A.closeTrip(s, id)),
        confirmClaim: (id) => apply((s) => A.confirmClaim(s, id)),
        resolveException: (tripId, exId, res) => apply((s) => A.resolveException(s, tripId, exId, res)),
        updatePolicy: (patch) => apply((s) => A.updatePolicy(s, patch)),
        advanceDay: () => apply(A.advanceDay),
        setClock: (clock) => apply((s) => A.setClock(s, clock)),
        reset: () => set(makeSeed()),
      };
    },
    {
      name: STORAGE_KEY,
      version: VERSION,
      storage: safeStorage,
      partialize: (s) => ({ policy: s.policy, employees: s.employees, trips: s.trips, currentEmployeeId: s.currentEmployeeId, clock: s.clock }),
      // Any older or unknown shape falls back to a fresh seed.
      migrate: () => makeSeed(),
      merge: (persisted, current) => (isValid(persisted) ? { ...current, ...persisted } : current),
    },
  ),
);

/** True once persisted state has loaded — avoids SSR/localStorage mismatches. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const done = () => setHydrated(true);
    const unsub = useDemo.persist.onFinishHydration(done);
    if (useDemo.persist.hasHydrated()) done();
    return unsub;
  }, []);
  return hydrated;
}

export const useActiveTrip = () => useDemo((s) => A.activeTrip(s));
export const useCurrentEmployee = () => useDemo((s) => s.employees.find((e) => e.id === s.currentEmployeeId)!);
