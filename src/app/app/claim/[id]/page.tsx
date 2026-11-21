"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useDemo, useCurrentEmployee } from "@/store/useDemo";
import { formatZAR } from "@/engine/money";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { shortDate } from "@/lib/format";

function Line({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="py-2.5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="font-bold">{value}</p>
      {sub && <p className="text-[12px] text-faint">{sub}</p>}
    </div>
  );
}

export default function ClaimPage() {
  const { id } = useParams<{ id: string }>();
  const trip = useDemo((s) => s.trips.find((t) => t.id === id));
  const confirmClaim = useDemo((s) => s.confirmClaim);
  const emp = useCurrentEmployee();
  const [paying, setPaying] = useState(false);

  if (!trip || !trip.claim) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="font-semibold">No claim here</p>
        <p className="mt-1 text-sm text-muted">Claims appear once a trip is closed.</p>
        <Link href="/app" className="mt-5 inline-block font-semibold text-teal">
          Back home
        </Link>
      </div>
    );
  }

  const c = trip.claim;
  const open = c.exceptions.filter((e) => e.status === "open");

  if (trip.status === "paid") {
    return (
      <div className="px-5 pb-10 pt-10 text-center animate-rise">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-teal text-paper animate-pop">
          <CheckCircle2 size={40} />
        </div>
        <p className="mt-6 text-sm text-muted">Paid to {emp.bankMasked}</p>
        <p className="mt-1 font-display text-[40px] font-bold leading-none">
          <Money cents={c.payable} />
        </p>
        <p className="mt-3 text-sm text-muted">
          via PayShap · ref <span className="tabular font-semibold text-ink">{trip.payoutRef}</span>
        </p>
        <span className="mt-2 inline-block rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">Simulated</span>
        <Panel className="mt-8 p-4 text-left">
          <p className="font-semibold">{trip.title}</p>
          <p className="text-[13px] text-muted">
            Closed {trip.closedAt ? shortDate(trip.closedAt) : ""} · paid same day · journal posted to the ledger
          </p>
          {c.held > 0 && (
            <p className="mt-2 text-[13px] text-orange-2">
              {formatZAR(c.held)} is held while finance reviews {open.length} item{open.length === 1 ? "" : "s"}.
            </p>
          )}
        </Panel>
        <Link href="/app" className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-ink font-semibold text-paper">
          Done
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Claim ready" back="/app" sub={`${trip.city} · closed ${trip.closedAt ? shortDate(trip.closedAt) : ""}`} />
      <div className="px-5">
        <Panel className="divide-y divide-line px-4">
          <Line label="Card spend" value={<>{formatZAR(c.cardSpend)} · settled</>} sub="Already paid on the trip card — nothing to claim." />
          <Line label={`Mileage ${c.gpsKm} km`} value={<Money cents={c.paidMileage.total} />} sub={c.paidMileage.taxable ? `${formatZAR(c.paidMileage.taxable)} taxable (3702)` : "Tax-free at the SARS rate (3703)"} />
          {trip.outOfPocket.map((r) => (
            <Line key={r.id} label={r.description} value={<Money cents={r.amount} />} />
          ))}
          {c.held > 0 && <Line label="Held for review" value={<span className="text-orange-2">{formatZAR(c.held)}</span>} sub="Manual kilometres without GPS." />}
        </Panel>

        <div className="mt-3 rounded-3xl bg-ink p-5 text-paper">
          <p className="text-sm text-mist/80">Paid to you</p>
          <p className="mt-1 font-display text-[36px] font-bold leading-none">
            <Money cents={c.payable} />
          </p>
        </div>

        {open.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 rounded-2xl bg-teal-soft px-4 py-3 text-sm font-semibold text-teal">
            <ShieldCheck size={18} /> Policy check: 0 exceptions
          </p>
        ) : (
          <div className="mt-3 rounded-2xl bg-orange-soft px-4 py-3 text-sm text-orange-2">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={16} /> {open.length} item{open.length > 1 ? "s" : ""} sent to finance
            </p>
            <ul className="mt-1.5 list-disc pl-6 text-[13px]">
              {open.map((e) => (
                <li key={e.id}>{e.description}</li>
              ))}
            </ul>
            <p className="mt-1.5 text-[12px]">Everything else is paid now.</p>
          </div>
        )}

        <Button
          size="lg"
          className="mt-5 w-full"
          disabled={paying}
          onClick={() => {
            setPaying(true);
            setTimeout(() => confirmClaim(trip.id), 1100);
          }}
        >
          {paying ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Paying via PayShap…
            </>
          ) : (
            "Confirm"
          )}
        </Button>
        <p className="mt-2 text-center text-[12px] text-faint">Confirm, don&apos;t compile. Payout is simulated.</p>
      </div>
    </div>
  );
}
