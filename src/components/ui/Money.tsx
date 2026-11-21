import { formatZAR, type Cents } from "@/engine/money";
import { cx } from "./cx";

export function Money({ cents, whole, className }: { cents: Cents; whole?: boolean; className?: string }) {
  return <span className={cx("tabular whitespace-nowrap", className)}>{formatZAR(cents, { whole })}</span>;
}
