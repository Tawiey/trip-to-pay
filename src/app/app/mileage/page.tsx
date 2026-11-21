"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, PenLine, Satellite } from "lucide-react";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { mileagePay } from "@/engine/mileage";
import { SARS_KM_RATE } from "@/engine/policy";
import { formatZAR } from "@/engine/money";
import { DRIVE_PRESETS, makeRoute } from "@/store/seed";
import type { Drive } from "@/engine/types";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Money } from "@/components/ui/Money";
import { ScreenHeader, Panel } from "@/components/app/AppShell";
import { RouteMap } from "@/components/app/RouteMap";
import { Sheet } from "@/components/app/Sheet";
import { useMyTrips } from "@/components/app/useMyTrips";
import { shortDate, time } from "@/lib/format";
import { cx } from "@/components/ui/cx";

const field = "h-11 w-full rounded-xl border border-line bg-white px-3 text-[15px] outline-none focus:border-teal";

function DriveCard({ drive, big }: { drive: Drive; big?: boolean }) {
  const policy = useDemo((s) => s.policy);
  const pay = mileagePay(policy, drive.km);
  return (
    <Panel className="overflow-hidden p-3">
      {drive.gps && big && <RouteMap route={drive.route} className="mb-3 border border-line" />}
      <div className="flex items-start gap-3 px-1">
        {!big && (
          <span className={cx("grid size-10 shrink-0 place-items-center rounded-xl", drive.gps ? "bg-teal-soft text-teal" : "bg-orange-soft text-orange-2")}>
            {drive.gps ? <Satellite size={18} /> : <PenLine size={18} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {drive.from} → {drive.to}
          </p>
          <p className="text-[13px] text-muted">
            {shortDate(drive.startAt)} · {time(drive.startAt)}–{time(drive.endAt)} · {drive.purpose}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line px-3 py-2.5">
          <p className="tabular font-display text-lg font-bold">{drive.km} km</p>
          <p className={cx("text-[12px] font-semibold", drive.gps ? "text-teal" : "text-orange-2")}>{drive.gps ? "GPS-verified" : "No GPS · held for review"}</p>
        </div>
        <div className="rounded-xl border border-line px-3 py-2.5">
          <Money cents={pay.total} className="font-display text-lg font-bold" />
          <p className="tabular text-[12px] text-muted">at {formatZAR(policy.companyKmRate)}/km</p>
        </div>
      </div>
    </Panel>
  );
}

function Tracker({ onDone }: { onDone: () => void }) {
  const addDrive = useDemo((s) => s.addDrive);
  const push = useToast((s) => s.push);
  const policy = useDemo((s) => s.policy);
  const [preset] = useState(() => DRIVE_PRESETS[Math.floor(Math.random() * 3)]);
  const [route] = useState(() => {
    let a = Math.floor(Math.random() * 10000);
    return makeRoute(() => ((a = (a * 9301 + 49297) % 233280) / 233280));
  });
  const [progress, setProgress] = useState(0);
  const [purpose, setPurpose] = useState(preset.purpose);
  const raf = useRef<number>(0);

  useEffect(() => {
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 4500);
      setProgress(p);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const km = Math.round(preset.km * progress * 10) / 10;
  const done = progress >= 1;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{done ? "Drive complete" : "Tracking drive…"}</h2>
        <Chip tone={done ? "teal" : "orange"} dot>
          {done ? "GPS-verified" : "Live GPS"}
        </Chip>
      </div>
      <p className="mt-1 text-sm text-muted">
        {preset.from} → {preset.to}
      </p>
      <RouteMap route={route} progress={progress} className="mt-4 border border-line" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-ink px-4 py-3 text-paper">
          <p className="tabular font-display text-2xl font-bold">{km.toFixed(1)} km</p>
          <p className="text-[12px] text-mist/70">distance</p>
        </div>
        <div className="rounded-xl border border-line px-4 py-3">
          <Money cents={mileagePay(policy, km).total} className="font-display text-2xl font-bold" />
          <p className="text-[12px] text-muted">claim value</p>
        </div>
      </div>
      <label className="mt-4 block">
        <span className="mb-1.5 block text-[13px] font-semibold text-muted">Business purpose (for the SARS logbook)</span>
        <input className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
      </label>
      <Button
        size="lg"
        className="mt-4 w-full"
        disabled={!done || !purpose.trim()}
        onClick={() => {
          addDrive({ from: preset.from, to: preset.to, km: preset.km, minutes: preset.minutes, purpose: purpose.trim(), gps: true });
          push({ tone: "ok", title: `${preset.km} km logged`, body: "Added to your SARS-ready logbook." });
          onDone();
        }}
      >
        {done ? "Save drive" : "Driving…"}
      </Button>
    </div>
  );
}

function ManualDrive({ onDone }: { onDone: () => void }) {
  const addDrive = useDemo((s) => s.addDrive);
  const push = useToast((s) => s.push);
  const [from, setFrom] = useState("Client, Westville");
  const [to, setTo] = useState("Supplier, Durban CBD");
  const [km, setKm] = useState("18");
  const [purpose, setPurpose] = useState("Parts collection");
  const n = Number(km);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!(n > 0)) return;
        addDrive({ from, to, km: Math.round(n * 10) / 10, minutes: Math.max(5, Math.round(n * 1.3)), purpose, gps: false });
        push({ tone: "warn", title: `${n} km added without GPS`, body: "Held until finance checks it." });
        onDone();
      }}
      className="space-y-3"
    >
      <h2 className="text-xl font-bold">Add a drive manually</h2>
      <p className="rounded-xl bg-orange-soft px-3.5 py-3 text-[13px] text-orange-2">
        Manual kilometres can&apos;t be checked against a route, so they&apos;re held as an exception until finance clears them.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input className={field} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <input className={field} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
      </div>
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <input className={field} inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value.replace(/[^\d.]/g, ""))} aria-label="Kilometres" />
        <input className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)} aria-label="Purpose" />
      </div>
      <Button size="lg" variant="dark" className="w-full" disabled={!(n > 0)}>
        Add {n > 0 ? `${n} km` : "drive"}
      </Button>
    </form>
  );
}

export default function MileagePage() {
  const policy = useDemo((s) => s.policy);
  const { focus } = useMyTrips();
  const [sheet, setSheet] = useState<"track" | "manual" | null>(null);
  const trip = focus;
  const drives = [...(trip?.drives ?? [])].sort((a, b) => b.startAt.localeCompare(a.startAt));
  const km = Math.round(drives.reduce((s, d) => s + d.km, 0) * 10) / 10;
  const live = trip?.status === "active";
  const excess = policy.companyKmRate > SARS_KM_RATE;

  return (
    <div className="pb-10 animate-rise">
      <ScreenHeader title="Mileage" sub={trip ? `${trip.title} · ${km} km in ${drives.length} drive${drives.length === 1 ? "" : "s"}` : undefined} />
      <div className="px-5">
        <div className="rounded-3xl bg-ink p-5 text-paper">
          <p className="text-sm text-mist/80">This trip</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="tabular font-display text-[34px] font-bold leading-none">{km} km</p>
            <Money cents={mileagePay(policy, km).total} className="font-display text-xl font-semibold text-[#6fd3bf]" />
          </div>
          <p className="mt-3 text-[13px] text-mist/70">
            Paid at {formatZAR(policy.companyKmRate)}/km.{" "}
            {excess ? `Above the SARS ${formatZAR(SARS_KM_RATE)} rate, the excess goes to PAYE (3702).` : "At the SARS rate it stays tax-free (3703)."}
          </p>
        </div>

        {live && (
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" variant="teal" onClick={() => setSheet("track")}>
              <Navigation size={18} /> Start drive
            </Button>
            <Button size="lg" variant="outline" onClick={() => setSheet("manual")} aria-label="Add drive manually">
              <PenLine size={18} />
            </Button>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {drives.length === 0 && <p className="py-8 text-center text-sm text-muted">No drives yet. Start one when you set off.</p>}
          {drives.map((d, i) => (
            <DriveCard key={d.id} drive={d} big={i === 0 && d.gps} />
          ))}
        </div>
      </div>

      <Sheet open={sheet !== null} onClose={() => setSheet(null)} label="Drive">
        {sheet === "track" && <Tracker onDone={() => setSheet(null)} />}
        {sheet === "manual" && <ManualDrive onDone={() => setSheet(null)} />}
      </Sheet>
    </div>
  );
}
