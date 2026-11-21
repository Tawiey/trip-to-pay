"use client";

import { useState } from "react";
import { Camera, Check, Loader2, Plus, Wallet } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { formatZAR, rands } from "@/engine/money";
import { CATEGORY_LABEL, type MerchantCategory, type Txn } from "@/engine/types";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { CategoryIcon } from "@/components/app/categoryIcon";
import { Sheet } from "@/components/app/Sheet";
import { useMyTrips } from "@/components/app/useMyTrips";
import { shortDate, time } from "@/lib/format";

function NeedsSlip({ txn, tripId }: { txn: Txn; tripId: string }) {
  const attachSlip = useDemo((s) => s.attachSlip);
  const push = useToast((s) => s.push);
  const [busy, setBusy] = useState(false);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CategoryIcon category={txn.category} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{txn.merchant}</p>
        <p className="text-[13px] text-muted">
          <Money cents={txn.amount} /> · {shortDate(txn.at)} {time(txn.at)}
        </p>
      </div>
      <Button
        size="sm"
        variant="dark"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setTimeout(() => {
            attachSlip(tripId, txn.id);
            push({ tone: "ok", title: "Slip matched", body: `${txn.merchant} · VAT ${formatZAR(Math.round((txn.amount * 15) / 115))} captured for input tax.` });
          }, 900);
        }}
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} {busy ? "Reading" : "Snap slip"}
      </Button>
    </li>
  );
}

export default function ReceiptsPage() {
  const { focus: trip } = useMyTrips();
  const addOutOfPocket = useDemo((s) => s.addOutOfPocket);
  const push = useToast((s) => s.push);
  const [adding, setAdding] = useState(false);
  const [desc, setDesc] = useState("Parking at client");
  const [amount, setAmount] = useState("60");
  const [category, setCategory] = useState<MerchantCategory>("parking");

  if (!trip) return <ScreenHeader title="Receipts" sub="Nothing yet — receipts attach to a trip." />;

  const approved = trip.txns.filter((t) => t.status === "approved");
  const needs = approved.filter((t) => t.needsSlip && !t.slipAttached);
  const matched = approved.filter((t) => t.slipAttached);
  const noSlip = approved.filter((t) => !t.needsSlip);
  const live = trip.status === "active";

  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Receipts" sub="Card data is the receipt. We only ask for a slip where VAT needs one." />
      <div className="space-y-6 px-5">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: matched.length + noSlip.length, l: "matched", c: "text-teal" },
            { n: needs.length, l: "need a slip", c: needs.length ? "text-orange-2" : "text-faint" },
            { n: trip.outOfPocket.length, l: "paid yourself", c: "text-ink" },
          ].map((x) => (
            <Panel key={x.l} className="px-2 py-3">
              <p className={`font-display text-2xl font-bold ${x.c}`}>{x.n}</p>
              <p className="text-[12px] text-muted">{x.l}</p>
            </Panel>
          ))}
        </div>

        {needs.length > 0 && (
          <section>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-orange-2">Needs a slip</h2>
            <Panel>
              <ul className="divide-y divide-line">
                {needs.map((t) => (
                  <NeedsSlip key={t.id} txn={t} tripId={trip.id} />
                ))}
              </ul>
            </Panel>
          </section>
        )}

        <section>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">Matched</h2>
          <Panel>
            <ul className="divide-y divide-line">
              {[...matched, ...noSlip].map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-8 place-items-center rounded-full bg-teal-soft text-teal">
                    <Check size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{t.merchant}</p>
                    <p className="text-[12px] text-muted">{t.slipAttached ? `Slip · VAT ${formatZAR(t.vat ?? 0)}` : "Card data only · under R50"}</p>
                  </div>
                  <Money cents={t.amount} className="font-semibold" />
                </li>
              ))}
              {matched.length + noSlip.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nothing yet.</li>}
            </ul>
          </Panel>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">Paid yourself</h2>
            {live && (
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-sm font-semibold text-teal">
                <Plus size={15} /> Add
              </button>
            )}
          </div>
          <Panel>
            <ul className="divide-y divide-line">
              {trip.outOfPocket.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="grid size-8 place-items-center rounded-full bg-mist text-muted">
                    <Wallet size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{r.description}</p>
                    <p className="text-[12px] text-muted">Reimbursed when the trip closes</p>
                  </div>
                  <Money cents={r.amount} className="font-semibold" />
                </li>
              ))}
              {trip.outOfPocket.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">Nothing paid personally.</li>}
            </ul>
          </Panel>
        </section>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} label="Add out-of-pocket expense">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (!(n > 0) || !desc.trim()) return;
            addOutOfPocket(trip.id, { description: desc.trim(), category, amount: rands(n) });
            push({ tone: "ok", title: "Slip captured", body: `${desc.trim()} · ${formatZAR(rands(n))} added to your claim.` });
            setAdding(false);
          }}
        >
          <h2 className="text-xl font-bold">Paid out of pocket</h2>
          <p className="text-sm text-muted">Snap the slip; we read the amount and add it to what you&apos;re owed.</p>
          <input className="h-11 w-full rounded-xl border border-line bg-white px-3" value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Description" />
          <div className="grid grid-cols-2 gap-2">
            <input className="h-11 w-full rounded-xl border border-line bg-white px-3" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} aria-label="Amount in rand" />
            <select className="h-11 w-full rounded-xl border border-line bg-white px-2" value={category} onChange={(e) => setCategory(e.target.value as MerchantCategory)} aria-label="Category">
              {(["parking", "transport", "meals", "incidentals", "fuel"] as MerchantCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
              ))}
            </select>
          </div>
          <Button size="lg" className="w-full">
            <Camera size={18} /> Add slip
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
