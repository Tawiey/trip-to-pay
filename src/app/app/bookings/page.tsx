"use client";

import { BedDouble, Plane } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { useMyTrips } from "@/components/app/useMyTrips";

export default function BookingsPage() {
  const { focus: trip } = useMyTrips();
  const bookings = trip?.bookings ?? [];
  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Bookings" back="/app" sub={trip?.title} />
      <div className="space-y-3 px-5">
        {bookings.map((b) => (
          <Panel key={b.id} className="flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal">
              {b.kind === "flight" ? <Plane size={18} /> : <BedDouble size={18} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{b.title}</p>
              <p className="text-[13px] text-muted">{b.detail}</p>
              <div className="mt-2">{b.withinCap ? <Chip tone="teal">Within policy cap</Chip> : <Chip tone="orange">Over cap · approved once</Chip>}</div>
            </div>
            <Money cents={b.amount} className="font-semibold" />
          </Panel>
        ))}
        {bookings.length === 0 && <p className="py-8 text-center text-sm text-muted">No bookings on this trip.</p>}
        <p className="pt-2 text-center text-[12px] text-faint">Booked on the trip card, inside the city cap. In-app booking arrives in phase 3.</p>
      </div>
    </div>
  );
}
