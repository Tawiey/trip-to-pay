"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { journalFor, payrollCodes } from "@/engine/ledger";
import { Money } from "@/components/ui/Money";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { PageTitle, Card } from "@/components/finance/FinanceShell";
import { ExceptionActions } from "@/components/finance/ExceptionActions";
import { exceptionRows, kpis } from "@/components/finance/selectors";
import { dateRange, shortName } from "@/lib/format";
import { cx } from "@/components/ui/cx";

function Kpi({ value, label, tone }: { value: string | number; label: string; tone?: "teal" | "orange" }) {
  return (
    <Card className="p-5">
      <p className={cx("font-display text-3xl font-bold tabular", tone === "teal" && "text-teal", tone === "orange" && "text-orange-2")}>{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </Card>
  );
}

export default function Overview() {
  const s = useDemo();
  const push = useToast((t) => t.push);
  const k = kpis(s);
  const open = exceptionRows(s, "open");
  const cleared = exceptionRows(s, "resolved").slice(0, 4);
  const journal = journalFor(s.trips);
  const payroll = payrollCodes(s.trips);
  const pending = s.trips.filter((t) => t.status === "pending_approval");
  const emp = (id: string) => s.employees.find((e) => e.id === id)!;

  return (
    <>
      <PageTitle eyebrow="Finance console" title="Exceptions, not claims" right={<Chip tone="mist">Live demo data</Chip>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi value={k.closed} label="trips closed" />
        <Kpi value={`${k.autoPct}%`} label="auto-approved" tone="teal" />
        <Kpi value={k.openExceptions} label="open exceptions" tone="orange" />
        <Kpi value={k.timeToPay} label="time to pay" />
      </div>

      {pending.length > 0 && (
        <Card className="mt-4 border-orange/40 bg-orange-soft/40 p-5">
          <p className="text-sm font-semibold text-orange-2">Needs one approval tap</p>
          <ul className="mt-3 space-y-3">
            {pending.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {emp(t.employeeId).name} · {t.title}
                  </p>
                  <p className="text-sm text-muted">
                    {dateRange(t.startDate, t.endDate)} · <Money cents={t.allowance.total} whole /> requested · {t.purpose}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="teal"
                  onClick={() => {
                    s.approveTrip(t.id);
                    push({ tone: "ok", title: "Trip approved", body: `Card issued to ${emp(t.employeeId).name.split(" ")[0]}'s wallet.` });
                  }}
                >
                  Approve trip
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <h2 className="text-lg font-bold">Exceptions</h2>
            <Link href="/finance/trips" className="inline-flex items-center gap-1 text-sm font-semibold text-teal">
              All trips <ArrowRight size={14} />
            </Link>
          </div>
          {open.length === 0 ? (
            <div className="flex flex-col items-center px-5 pb-10 pt-6 text-center">
              <CheckCircle2 className="text-teal" size={32} />
              <p className="mt-3 font-semibold">Nothing to review</p>
              <p className="text-sm text-muted">Every closed trip passed policy and SARS checks.</p>
            </div>
          ) : (
            <>
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="border-y border-line bg-cream/60 text-[12px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Employee</th>
                    <th className="px-3 py-2.5 font-semibold">Trip</th>
                    <th className="px-3 py-2.5 font-semibold">Rule triggered</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Amount</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Suggested</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {open.map(({ ex, trip, employee }) => (
                    <tr key={ex.id} className="align-middle">
                      <td className="px-5 py-3.5 font-semibold">{shortName(employee.name)}</td>
                      <td className="px-3 py-3.5">
                        <Link href={`/finance/trips/${trip.id}`} className="hover:text-teal hover:underline">
                          {trip.city} {dateRange(trip.startDate, trip.endDate)}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 text-muted">{ex.description}</td>
                      <td className="px-3 py-3.5 text-right font-semibold">
                        <Money cents={ex.amount} />
                      </td>
                      <td className="px-5 py-3.5">
                        <ExceptionActions ex={ex} trip={trip} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <ul className="divide-y divide-line border-t border-line md:hidden">
                {open.map(({ ex, trip, employee }) => (
                  <li key={ex.id} className="space-y-2 px-5 py-4">
                    <div className="flex justify-between gap-3">
                      <p className="font-semibold">{shortName(employee.name)}</p>
                      <Money cents={ex.amount} className="font-semibold" />
                    </div>
                    <p className="text-sm text-muted">
                      {trip.city} {dateRange(trip.startDate, trip.endDate)} · {ex.description}
                    </p>
                    <ExceptionActions ex={ex} trip={trip} />
                  </li>
                ))}
              </ul>
            </>
          )}
          {cleared.length > 0 && (
            <div className="border-t border-line px-5 py-4">
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-faint">Recently cleared</p>
              <ul className="space-y-2 text-sm">
                {cleared.map(({ ex, trip, employee }) => (
                  <li key={ex.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-muted">
                      {shortName(employee.name)} · {trip.city} · {ex.description}
                    </span>
                    <ExceptionActions ex={ex} trip={trip} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="bg-[#efece5] p-5">
          <h2 className="text-lg font-bold">Posted automatically</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {journal.map((l) => (
              <li key={`${l.side}-${l.account}`} className="flex justify-between gap-3">
                <span className="text-muted">
                  {l.side} {l.account}
                </span>
                <Money cents={l.amount} whole className="font-semibold" />
              </li>
            ))}
          </ul>
          <h2 className="mt-7 text-lg font-bold">Payroll codes</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-muted">3703 non-taxable</span>
              <Money cents={payroll.code3703} whole className="font-semibold" />
            </li>
            <li className="flex justify-between">
              <span className="text-muted">3702 taxable</span>
              <Money cents={payroll.code3702} whole className="font-semibold" />
            </li>
            <li className="flex justify-between">
              <span className="text-muted">Recoveries (deduction)</span>
              <Money cents={payroll.recoveries} whole className="font-semibold" />
            </li>
          </ul>
          <Link href="/finance/exports" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-teal">
            Export CSV <ArrowRight size={14} />
          </Link>
        </Card>
      </div>
    </>
  );
}
