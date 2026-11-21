import { cx } from "./cx";

export function Progress({ value, tone = "teal", track = "bg-mist", className }: { value: number; tone?: "teal" | "orange" | "red"; track?: string; className?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full", track, className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cx(
          "h-full rounded-full transition-[width] duration-700 ease-out",
          tone === "teal" && "bg-teal",
          tone === "orange" && "bg-orange",
          tone === "red" && "bg-[#c8492f]",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
