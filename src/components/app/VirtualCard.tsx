"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Card } from "@/engine/types";
import { shortDate } from "@/lib/format";
import { cx } from "@/components/ui/cx";

export function VirtualCard({ card, city, className, animate }: { card: Card; city: string; className?: string; animate?: boolean }) {
  const [reveal, setReveal] = useState(false);
  const expired = card.status === "expired";
  return (
    <div
      className={cx(
        "relative aspect-[1.586] w-full overflow-hidden rounded-[20px] p-5 text-paper shadow-lift",
        expired ? "bg-gradient-to-br from-[#53606c] to-[#2c3946]" : "bg-gradient-to-br from-teal via-[#0b5f57] to-ink-2",
        animate && "animate-card-in",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-white/[0.06]" />
      <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-black/10" />
      <div className="relative flex items-start justify-between">
        <span className="font-display text-[13px] font-bold tracking-[0.18em]">TRIP-TO-PAY</span>
        <span className="text-[13px] text-paper/85">{expired ? "Expired" : "Virtual"}</span>
      </div>
      <p className="tabular relative mt-[13%] font-display text-[22px] tracking-[0.14em]">{reveal ? card.pan : `•••• ${card.last4}`}</p>
      <div className="relative mt-[7%] flex items-end justify-between text-[13px] text-paper/90">
        <span>
          {city} · {expired ? "expired" : "expires"} {shortDate(card.expiresOn)}
          {reveal && <span className="tabular ml-2">CVV {card.cvv}</span>}
        </span>
        {!expired && (
          <button
            onClick={() => setReveal((r) => !r)}
            className="-m-2 rounded-full p-2 text-paper/80 hover:bg-white/10 hover:text-paper"
            aria-label={reveal ? "Hide card details" : "Show card details"}
          >
            {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
    </div>
  );
}
