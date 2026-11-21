"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { DEFAULT_POLICY, SARS_DAILY_MEALS, SARS_KM_RATE } from "@/engine/policy";
import { CATEGORY_LABEL, CITIES, type City, type Grade, type MerchantCategory } from "@/engine/types";
import { formatZAR, rands } from "@/engine/money";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PageTitle, Card } from "@/components/finance/FinanceShell";
import { cx } from "@/components/ui/cx";

type RandInputProps = { cents: number; onCommit: (c: number) => void; label: string; step?: string };

/** Rand input that commits valid numbers on blur/enter; remounts when the stored value changes. */
function RandInput(props: RandInputProps) {
  return <RandField key={props.cents} {...props} />;
}

function RandField({ cents, onCommit, label, step = "1" }: RandInputProps) {
  const [v, setV] = useState((cents / 100).toString());
  const commit = () => {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) onCommit(rands(n));
    else setV((cents / 100).toString());
  };
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-faint">R</span>
      <input
        type="number"
        min={0}
        step={step}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        className="tabular h-11 w-full rounded-xl border border-line bg-white pl-7 pr-3 text-[15px] outline-none focus:border-teal focus:ring-2 focus:ring-teal/15"
      />
    </label>
  );
}

function Rule({ title, source, children, note }: { title: string; source: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="grid gap-3 border-b border-line px-5 py-5 last:border-0 md:grid-cols-[1fr_300px] md:items-start">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted">{source}</p>
        {note && <div className="mt-1.5 text-[13px]">{note}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

const BLOCKABLE: MerchantCategory[] = ["alcohol", "entertainment", "cash", "fuel", "incidentals"];

export default function PolicyPage() {
  const policy = useDemo((s) => s.policy);
  const update = useDemo((s) => s.updatePolicy);
  const push = useToast((t) => t.push);
  const saved = (what: string) => push({ tone: "ok", title: "Policy updated", body: `${what} applies to the next swipe.` });

  const setHotel = (g: Grade, c: City, v: number) =>
    update({ hotelCapPerNight: { ...policy.hotelCapPerNight, [g]: { ...policy.hotelCapPerNight[g], [c]: v } } });

  return (
    <>
      <PageTitle
        eyebrow="Policy & SARS engine"
        title="Rules run before and after every rand"
        right={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              update(DEFAULT_POLICY);
              push({ tone: "info", title: "Policy reset to defaults" });
            }}
          >
            <RotateCcw size={14} /> Defaults
          </Button>
        }
      />
      <p className="-mt-3 mb-6 max-w-2xl text-sm text-muted">
        Changes apply instantly — swipe the card in demo controls to see them enforced at the till.
      </p>

      <Card>
        <Rule
          title="Daily dining cap"
          source={`SARS deemed local meals & incidentals ${formatZAR(SARS_DAILY_MEALS)}/day (2026/27). Company can set lower.`}
          note={policy.diningCapPerDay > SARS_DAILY_MEALS && <span className="text-orange-2">Above the SARS deemed amount — the excess may be taxable.</span>}
        >
          <RandInput label="Daily dining cap" cents={policy.diningCapPerDay} onCommit={(c) => { update({ diningCapPerDay: c }); saved("Dining cap"); }} />
          <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-mist p-1 text-sm font-semibold">
            {(["decline", "flag"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { update({ diningOverCapMode: m }); saved(m === "decline" ? "Decline over cap" : "Allow & flag"); }}
                className={cx("h-9 rounded-lg", policy.diningOverCapMode === m ? "bg-paper shadow-card" : "text-muted")}
              >
                {m === "decline" ? "Decline at till" : "Allow & flag"}
              </button>
            ))}
          </div>
        </Rule>

        <Rule
          title="Mileage rate"
          source={`SARS ${formatZAR(SARS_KM_RATE)}/km for 2026/27 where no other vehicle allowance is paid.`}
          note={
            policy.companyKmRate > SARS_KM_RATE ? (
              <span className="text-orange-2">Excess {formatZAR(policy.companyKmRate - SARS_KM_RATE)}/km goes to PAYE (3702).</span>
            ) : (
              <span className="text-teal">All GPS km stay tax-free under code 3703.</span>
            )
          }
        >
          <RandInput label="Company mileage rate" step="0.01" cents={policy.companyKmRate} onCommit={(c) => { update({ companyKmRate: c }); saved("Mileage rate"); }} />
        </Rule>

        <Rule title="Blocked merchants" source="Company policy. Blocked at authorisation — the card simply declines.">
          <div className="flex flex-wrap gap-2">
            {BLOCKABLE.map((c) => {
              const on = policy.blockedCategories.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => {
                    update({ blockedCategories: on ? policy.blockedCategories.filter((x) => x !== c) : [...policy.blockedCategories, c] });
                    saved(`${CATEGORY_LABEL[c]} ${on ? "allowed" : "blocked"}`);
                  }}
                  aria-pressed={on}
                  className={cx("h-9 rounded-full border px-3.5 text-sm font-semibold transition", on ? "border-orange-2 bg-orange-soft text-orange-2" : "border-line bg-white text-muted")}
                >
                  {on ? "Blocked · " : ""}
                  {CATEGORY_LABEL[c]}
                </button>
              );
            })}
          </div>
        </Rule>

        <Rule title="Evidence & VAT" source="Card data plus slip or e-invoice. Slips are only requested where a VAT invoice is needed.">
          <RandInput label="Slip required above" cents={policy.slipThreshold} onCommit={(c) => { update({ slipThreshold: c }); saved("Slip threshold"); }} />
        </Rule>

        <Rule title="Daily allowances" source="Used to build each trip's budget the moment it's requested.">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1 text-[12px] text-muted">Transport / day</p>
              <RandInput label="Transport per day" cents={policy.transportPerDay} onCommit={(c) => { update({ transportPerDay: c }); saved("Transport allowance"); }} />
            </div>
            <div>
              <p className="mb-1 text-[12px] text-muted">Incidentals / day</p>
              <RandInput label="Incidentals per day" cents={policy.incidentalsPerDay} onCommit={(c) => { update({ incidentalsPerDay: c }); saved("Incidentals allowance"); }} />
            </div>
          </div>
        </Rule>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div>
            <h2 className="text-lg font-bold">Hotel cap per night</h2>
            <p className="text-sm text-muted">By grade and city. Bookings above the cap need one approval tap.</p>
          </div>
          <Chip tone="mist">Flights estimated at {formatZAR(policy.flightEstimate, { whole: true })} return</Chip>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="border-y border-line bg-cream/60 text-left text-[12px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2.5 font-semibold">Grade</th>
                {CITIES.map((c) => (
                  <th key={c} className="px-2 py-2.5 font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(["A", "B", "C"] as Grade[]).map((g) => (
                <tr key={g}>
                  <td className="px-5 py-2 font-semibold">{g}</td>
                  {CITIES.map((c) => (
                    <td key={c} className="px-1.5 py-2">
                      <RandInput label={`Grade ${g} ${c}`} cents={policy.hotelCapPerNight[g][c]} onCommit={(v) => setHotel(g, c, v)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-6 text-[12px] text-faint">SARS figures: Notices 7182 and 7174, years of assessment from 1 March 2026. Rates reload each tax year. Not tax advice.</p>
    </>
  );
}
