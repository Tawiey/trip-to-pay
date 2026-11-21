import { cx } from "./cx";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-2 font-display font-bold tracking-tight", light ? "text-paper" : "text-ink", className)}>
      <span className="relative inline-block h-5 w-7">
        <span className="absolute left-1.5 top-0 h-4 w-6 -rotate-6 rounded-[4px] bg-teal" />
        <span className="absolute left-0 top-1 h-4 w-6 rotate-3 rounded-[4px] bg-orange" />
      </span>
      Trip-to-Pay
    </span>
  );
}
