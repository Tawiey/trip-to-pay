import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

type Variant = "primary" | "dark" | "teal" | "ghost" | "outline";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-orange text-ink hover:bg-[#ec9050] active:bg-orange-2 shadow-[0_6px_18px_-6px_rgb(229_130_58/0.6)]",
  dark: "bg-ink text-paper hover:bg-ink-3",
  teal: "bg-teal text-paper hover:bg-teal-2",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  outline: "bg-paper text-ink border border-line hover:border-ink/30",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal cursor-pointer",
        size === "sm" && "h-8 px-3.5 text-[13px]",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-[52px] px-6 text-[15px]",
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
