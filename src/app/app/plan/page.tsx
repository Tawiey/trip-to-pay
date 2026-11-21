"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { useDemo, useCurrentEmployee } from "@/store/useDemo";
import { computeAllowance } from "@/engine/allowance";
import { CITIES, type City, type Trip } from "@/engine/types";
import { addDays } from "@/engine/dates";
import { formatZAR, rands } from "@/engine/money";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { VirtualCard } from "@/components/app/VirtualCard";
import { cx } from "@/components/ui/cx";

const field = "h-12 w-full rounded-xl border border-line bg-white px-3.5 text-[15px] outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15";

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={cx("flex justify-between py-1.5 text-sm", muted ? "text-faint" : "text-muted")}>
      <span>{label}</span>
      <Money cents={value} className="text-ink" />
    </div>
  );
}

export default function PlanTrip() {
  const emp = useCurrentEmployee();
  const policy = useDemo((s) => s.policy);
  const clock = useDemo((s) => s.clock);
  const planTrip = useDemo((s) => s.planTrip);
  const today = clock.slice(0, 10);

  const [city, setCity] = useState<City>("Cape Town");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(addDays(today, 2));
  const [purpose, setPurpose] = useState("");
  const [needMore, setNeedMore] = useState(false);
  const [extra, setExtra] = useState("1200");
  const [created, setCreated] = useState<Trip | null>(null);

  const allowance = useMemo(() => computeAllowance(policy, emp.grade, city, start, end), [policy, emp.grade, city, start, end]);
  const extraCents = needMore ? rands(Number(extra) || 0) : 0;
  const valid = allowance.days > 0 && purpose.trim().length > 1;

  if (created) {
    const pending = created.status === "pending_approval";
    return (
      <div className="px-5 pb-10 pt-6 animate-rise">
        {pending ? (
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-orange-soft text-orange-2 animate-pop">
              <Clock3 size={30} />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Sent to your manager</h1>
            <p className="mx-auto mt-2 max-w-[280px] text-sm text-muted">
              {formatZAR(extraCents, { whole: true })} above policy needs one approval tap. Approve it yourself in Finance → Trips to see what happens next.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-teal">
              <CheckCircle2 size={20} />
              <span className="font-semibold">Approved by policy — instantly</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold">{created.title}</h1>
            <p className="mt-1 text-sm text-muted">
              Budget <Money cents={created.allowance.total} whole /> · card added to your phone wallet
            </p>
            <VirtualCard card={created.card!} city={created.city} animate className="mt-6" />
            {today < created.startDate && (
              <p className="mt-4 rounded-xl bg-mist px-4 py-3 text-[13px] text-muted">
                The card works from {created.startDate}. Use “Jump to” in demo controls to fast-forward.
              </p>
            )}
          </>
        )}
        <div className="mt-8 grid gap-2">
          <Link href={pending ? "/app" : "/app/wallet"} className="inline-flex h-[52px] items-center justify-center rounded-full bg-orange font-semibold text-ink">
            {pending ? "Back home" : "Open wallet"}
          </Link>
          {!pending && (
            <Link href="/app" className="inline-flex h-11 items-center justify-center font-semibold text-muted">
              Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Plan a trip" back="/app" sub="Where, when and why. Policy does the rest." />
      <form
        className="space-y-4 px-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          planTrip({ title: `${city} ${purpose.trim().toLowerCase().startsWith("client") ? "client visit" : "trip"}`, city, startDate: start, endDate: end, purpose: purpose.trim(), extra: extraCents });
          const s = useDemo.getState();
          setCreated(s.trips[0]);
        }}
      >
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-muted">Where</legend>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {CITIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCity(c)}
                className={cx(
                  "h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
                  c === city ? "border-ink bg-ink text-paper" : "border-line bg-white text-muted hover:border-ink/30",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-2 block text-[13px] font-semibold text-muted">From</span>
            <input type="date" className={field} value={start} min={today} onChange={(e) => setStart(e.target.value)} required />
          </label>
          <label>
            <span className="mb-2 block text-[13px] font-semibold text-muted">To</span>
            <input type="date" className={field} value={end} min={start} onChange={(e) => setEnd(e.target.value)} required />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-[13px] font-semibold text-muted">Why</span>
          <input className={field} placeholder="e.g. Client workshop with Atlantic Foods" value={purpose} onChange={(e) => setPurpose(e.target.value)} required />
        </label>

        <Panel className="p-4">
          <div className="flex items-baseline justify-between">
            <p className="font-semibold">Your budget</p>
            <p className="font-display text-2xl font-bold">
              <Money cents={allowance.total + extraCents} whole />
            </p>
          </div>
          <p className="mb-2 text-[12px] text-faint">
            Grade {emp.grade} · {city} · {allowance.nights} night{allowance.nights === 1 ? "" : "s"}, {allowance.days} day{allowance.days === 1 ? "" : "s"}
          </p>
          <Row label={`Hotel · ${formatZAR(policy.hotelCapPerNight[emp.grade][city], { whole: true })}/night cap`} value={allowance.lodging} />
          <Row label={`Meals · ${formatZAR(policy.diningCapPerDay, { whole: true })}/day (on card)`} value={allowance.meals} />
          <Row label="Local transport" value={allowance.transport} />
          <Row label="Incidentals" value={allowance.incidentals} />
          <Row label={allowance.flights ? "Return flights" : "Flights (home city)"} value={allowance.flights} muted={!allowance.flights} />
          {needMore && <Row label="Extra requested" value={extraCents} />}
        </Panel>

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" checked={needMore} onChange={(e) => setNeedMore(e.target.checked)} className="size-5 accent-teal" />
          I need more than policy allows
        </label>
        {needMore && (
          <label className="block">
            <span className="mb-2 block text-[13px] font-semibold text-muted">Extra amount (R) — needs one manager tap</span>
            <input inputMode="decimal" className={field} value={extra} onChange={(e) => setExtra(e.target.value.replace(/[^\d.]/g, ""))} />
          </label>
        )}

        <Button size="lg" className="w-full" disabled={!valid}>
          {needMore && extraCents > 0 ? "Send for approval" : "Request trip"}
        </Button>
        {allowance.days === 0 && <p className="text-center text-[13px] text-orange-2">End date must be on or after the start date.</p>}
      </form>
    </div>
  );
}
