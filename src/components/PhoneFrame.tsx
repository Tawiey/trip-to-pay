import type { ReactNode } from "react";

/** Shows the employee app inside a phone on desktop; full-screen on real phones. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="w-full md:relative md:h-[844px] md:w-[400px] md:shrink-0 md:rounded-[56px] md:bg-ink md:p-[10px] md:shadow-[0_40px_80px_-20px_rgb(19_32_46/0.45)]">
      <div className="relative min-h-dvh bg-paper md:h-full md:min-h-0 md:overflow-hidden md:rounded-[46px]">
        <div className="pointer-events-none absolute left-1/2 top-2.5 z-50 hidden h-[30px] w-[110px] -translate-x-1/2 rounded-full bg-ink md:block" />
        {children}
      </div>
    </div>
  );
}
