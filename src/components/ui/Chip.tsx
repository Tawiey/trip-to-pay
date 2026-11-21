import type { ReactNode } from "react";
import { cx } from "./cx";

type Tone = "teal" | "orange" | "ink" | "mist" | "red";
const TONES: Record<Tone, string> = {
  teal: "bg-teal-soft text-teal",
  orange: "bg-orange-soft text-orange-2",
  ink: "bg-ink text-paper",
  mist: "bg-mist text-muted",
  red: "bg-[#fbe1dc] text-[#b4412c]",
};

export function Chip({ tone = "teal", children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
