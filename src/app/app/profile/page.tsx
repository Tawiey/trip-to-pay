"use client";

import Link from "next/link";
import { useDemo, useCurrentEmployee } from "@/store/useDemo";
import { formatZAR } from "@/engine/money";
import { CATEGORY_LABEL } from "@/engine/types";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { initials } from "@/lib/format";

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
      <span className="text-muted">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}

export default function ProfilePage() {
  const emp = useCurrentEmployee();
  const policy = useDemo((s) => s.policy);
  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Profile" back="/app" />
      <div className="space-y-5 px-5">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-teal text-lg font-bold text-paper">{initials(emp.name)}</span>
          <div>
            <p className="text-lg font-bold">{emp.name}</p>
            <p className="text-sm text-muted">
              {emp.department} · Grade {emp.grade}
            </p>
          </div>
        </div>
        <Panel className="divide-y divide-line">
          <Row k="Company" v="Acme Engineering (Pty) Ltd" />
          <Row k="Paid into" v={emp.bankMasked} />
          <Row k="Payouts" v="PayShap, same day" />
        </Panel>
        <section>
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-faint">Your travel policy</h2>
          <Panel className="divide-y divide-line">
            <Row k="Dining cap" v={`${formatZAR(policy.diningCapPerDay, { whole: true })}/day`} />
            <Row k="Mileage" v={`${formatZAR(policy.companyKmRate)}/km`} />
            <Row k="Blocked" v={policy.blockedCategories.map((c) => CATEGORY_LABEL[c]).join(", ") || "Nothing"} />
            <Row k="Slip needed above" v={formatZAR(policy.slipThreshold, { whole: true })} />
          </Panel>
          <Link href="/finance/policy" className="mt-3 block text-center text-sm font-semibold text-teal">
            Edit policy in the finance console →
          </Link>
        </section>
      </div>
    </div>
  );
}
