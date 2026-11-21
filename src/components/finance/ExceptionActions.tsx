"use client";
import type { Trip, TripException } from "@/engine/types";
import { useDemo } from "@/store/useDemo";
import { useToast } from "@/store/toast";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { RESOLUTION_LABEL, SUGGESTED } from "./selectors";
import { formatZAR } from "@/engine/money";

export function ExceptionActions({ ex, trip }: { ex: TripException; trip: Trip }) {
  const resolve = useDemo((s) => s.resolveException);
  const push = useToast((s) => s.push);
  if (ex.status === "resolved") return <Chip tone="teal">{RESOLUTION_LABEL[ex.resolution!]}</Chip>;
  const suggested = SUGGESTED[ex.suggested];
  const act = (resolution: NonNullable<TripException["resolution"]>) => {
    resolve(trip.id, ex.id, resolution);
    push({
      tone: "ok",
      title: RESOLUTION_LABEL[resolution],
      body:
        resolution === "recovered"
          ? `${formatZAR(ex.amount)} deducted in the next payroll run.`
          : resolution === "approved" && ex.rule === "no_gps"
            ? `${formatZAR(ex.amount)} released to the employee.`
            : `${trip.title} updated. Audit trail recorded.`,
    });
  };
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button size="sm" variant="dark" onClick={() => act(suggested.resolution)}>
        {suggested.label}
      </Button>
      {suggested.resolution !== "approved" && (
        <Button size="sm" variant="outline" onClick={() => act("approved")}>
          Approve
        </Button>
      )}
    </div>
  );
}
