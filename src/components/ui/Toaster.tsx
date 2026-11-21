"use client";
import { CheckCircle2, Info, ShieldAlert, X } from "lucide-react";
import { useToast } from "@/store/toast";
import { cx } from "./cx";

export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-paper shadow-lift"
          role="status"
        >
          <span className={cx("mt-0.5", t.tone === "ok" && "text-[#6fd3bf]", t.tone === "warn" && "text-orange", t.tone === "info" && "text-mist")}>
            {t.tone === "ok" ? <CheckCircle2 size={18} /> : t.tone === "warn" ? <ShieldAlert size={18} /> : <Info size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[13px] text-mist/80">{t.body}</p>}
          </div>
          <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="text-mist/60 hover:text-paper">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
