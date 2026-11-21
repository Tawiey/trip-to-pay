import type { Trip } from "@/engine/types";
import { Chip } from "@/components/ui/Chip";
import { STATUS_LABEL } from "./selectors";

export function StatusChip({ status }: { status: Trip["status"] }) {
  const tone = status === "paid" ? "teal" : status === "active" ? "ink" : status === "pending_approval" ? "orange" : "mist";
  return (
    <Chip tone={tone} dot={status === "active"}>
      {STATUS_LABEL[status]}
    </Chip>
  );
}
