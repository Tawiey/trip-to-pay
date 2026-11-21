"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import type { Trip } from "@/engine/types";
import { tripSpend } from "@/engine/authorise";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { Button } from "@/components/ui/Button";
import { PageTitle, Card } from "@/components/finance/FinanceShell";
import { StatusChip } from "@/components/finance/StatusChip";
import { dateRange } from "@/lib/format";
import { cx } from "@/components/ui/cx";

const FILTERS: { id: string; label: string; match: (t: Trip) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "live", label: "Live", match: (t) => t.status === "active" },
  { id: "pending", label: "Awaiting approval", match: (t) => t.status === "pending_approval" },
  { id: "exceptions", label: "With exceptions", match: (t) => !!t.claim?.exceptions.some((e) => e.status === "open") },
  { id: "paid", label: "Paid", match: (t) => t.status === "paid" || t.status === "closed" },
];

export default function TripsPage() {
  const s = useDemo();
  const push = useToast((t) => t.push);
  const [filter, setFilter] = useState("all");
  const f = FILTERS.find((x) => x.id === filter)!;
  const emp = (id: string) => s.employees.find((e) => e.id === id)!;
  const order: Record<Trip["status"], number> = { pending_approval: 0, active: 1, closed: 2, paid: 3 };
  const trips = s.trips.filter(f.match).sort((a, b) => order[a.status] - order[b.status] || b.startDate.localeCompare(a.startDate));

  return (
    <>
      <PageTitle eyebrow="Trips" title="Every trip, every rand" />
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
        {FILTERS.map((x) => (
          <button
            key={x.id}
            onClick={() => setFilter(x.id)}
            className={cx("h-9 shrink-0 rounded-full border px-4 text-sm font-semibold", filter === x.id ? "border-ink bg-ink text-paper" : "border-line bg-paper text-muted hover:text-ink")}
          >
            {x.label} <span className="ml-1 opacity-60">{s.trips.filter(x.match).length}</span>
          </button>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-cream/60 text-[12px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-3 py-3 font-semibold">Trip</th>
                <th className="px-3 py-3 font-semibold">Dates</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Card spend</th>
                <th className="px-3 py-3 text-right font-semibold">Paid to employee</th>
                <th className="px-5 py-3 text-right font-semibold">Exceptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {trips.map((t) => {
                const openEx = t.claim?.exceptions.filter((e) => e.status === "open").length ?? 0;
                return (
                  <tr key={t.id} className="hover:bg-cream/50">
                    <td className="px-5 py-3 font-semibold">{emp(t.employeeId).name}</td>
                    <td className="px-3 py-3">
                      <Link href={`/finance/trips/${t.id}`} className="font-medium hover:text-teal hover:underline">
                        {t.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{dateRange(t.startDate, t.endDate)}</td>
                    <td className="px-3 py-3">
                      {t.status === "pending_approval" ? (
                        <Button
                          size="sm"
                          variant="teal"
                          onClick={() => {
                            s.approveTrip(t.id);
                            push({ tone: "ok", title: "Trip approved", body: "Virtual card issued to the employee's wallet." });
                          }}
                        >
                          Approve
                        </Button>
                      ) : (
                        <StatusChip status={t.status} />
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money cents={tripSpend(t)} />
                    </td>
                    <td className="px-3 py-3 text-right">{t.claim ? <Money cents={t.claim.payable} /> : <span className="text-faint">—</span>}</td>
                    <td className="px-5 py-3 text-right">{openEx ? <Chip tone="orange">{openEx} open</Chip> : t.claim ? <span className="text-teal">0</span> : <span className="text-faint">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {trips.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">No trips match this filter.</p>}
      </Card>
    </>
  );
}
