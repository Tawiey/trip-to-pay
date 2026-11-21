"use client";
import type { ReactNode } from "react";

/** Bottom sheet scoped to the phone screen. */
export function Sheet({ open, onClose, children, label }: { open: boolean; onClose: () => void; children: ReactNode; label: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:absolute" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-ink/35" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 animate-rise rounded-t-[28px] bg-paper px-5 pb-8 pt-3 shadow-lift">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-mist" />
        {children}
      </div>
    </div>
  );
}
