"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { journalFor, payrollCodes } from "@/engine/ledger";
import { toCSV } from "@/engine/csv";
import { tripSpend } from "@/engine/authorise";
import { Button } from "@/components/ui/Button";
import { PageTitle, Card } from "@/components/finance/FinanceShell";
import { isSettled } from "@/components/finance/selectors";

const r = (c: number) => (c / 100).toFixed(2);

function download(name: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ExportsPage() {
  const s = useDemo();
  const emp = new Map(s.employees.map((e) => [e.id, e]));
  const settled = s.trips.filter(isSettled);

  const journal = journalFor(s.trips).map((l) => ({ account: l.account, debit: l.side === "Dr" ? r(l.amount) : "", credit: l.side === "Cr" ? r(l.amount) : "" }));
  const payroll = s.employees
    .map((e) => {
      const trips = settled.filter((t) => t.employeeId === e.id);
      const p = payrollCodes(trips);
      const reimbursed = trips.reduce((x, t) => x + (t.claim?.payable ?? 0), 0);
      return { employee: e.name, code_3703: r(p.code3703), code_3702: r(p.code3702), recoveries: r(p.recoveries), reimbursed_via_payshap: r(reimbursed), trips: trips.length };
    })
    .filter((x) => x.trips > 0);
  const audit = s.trips.map((t) => ({
    trip: t.title,
    employee: emp.get(t.employeeId)!.name,
    start: t.startDate,
    end: t.endDate,
    status: t.status,
    approval: t.approval,
    budget: r(t.allowance.total),
    card_spend: r(tripSpend(t)),
    paid_to_employee: t.claim ? r(t.claim.payable) : "",
    open_exceptions: t.claim?.exceptions.filter((e) => e.status === "open").length ?? 0,
    payout_ref: t.payoutRef ?? "",
  }));

  const exports = [
    { name: "General ledger journal", file: "trip-to-pay-journal.csv", rows: journal, note: "Dr expense accounts, Cr card clearing and reimbursements. Import into Xero, Sage or SAP." },
    { name: "Payroll codes", file: "trip-to-pay-payroll.csv", rows: payroll, note: "Per employee: 3703 non-taxable, 3702 taxable, recoveries. Import into Sage, SimplePay or PaySpace." },
    { name: "Trip audit trail", file: "trip-to-pay-trips.csv", rows: audit, note: "Every trip with budget, spend, payout and exception status." },
  ];

  return (
    <>
      <PageTitle eyebrow="Exports" title="CSV to payroll and the GL" />
      <p className="-mt-3 mb-6 max-w-2xl text-sm text-muted">Pilot phase: clean CSV files. Native Sage, SimplePay, PaySpace and Xero connectors come next.</p>
      <div className="space-y-4">
        {exports.map((x) => (
          <Card key={x.file} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 p-5">
              <span className="grid size-11 place-items-center rounded-2xl bg-teal-soft text-teal">
                <FileSpreadsheet size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{x.name}</p>
                <p className="text-sm text-muted">{x.note}</p>
              </div>
              <Button variant="dark" size="sm" onClick={() => download(x.file, toCSV(x.rows))} disabled={x.rows.length === 0}>
                <Download size={14} /> {x.file}
              </Button>
            </div>
            {x.rows.length > 0 && (
              <div className="overflow-x-auto border-t border-line">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-cream/60 text-muted">
                    <tr>
                      {Object.keys(x.rows[0]).map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-2 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {x.rows.slice(0, 4).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="tabular whitespace-nowrap px-4 py-2">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {x.rows.length > 4 && <p className="px-4 py-2 text-[12px] text-faint">+ {x.rows.length - 4} more rows</p>}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
