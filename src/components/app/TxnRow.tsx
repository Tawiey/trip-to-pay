import Link from "next/link";
import type { Txn } from "@/engine/types";
import { CATEGORY_LABEL } from "@/engine/types";
import { Money } from "@/components/ui/Money";
import { time } from "@/lib/format";
import { CategoryIcon } from "./categoryIcon";
import { cx } from "@/components/ui/cx";

export function TxnRow({ txn }: { txn: Txn }) {
  const declined = txn.status === "declined";
  const flagged = txn.flags.length > 0;
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CategoryIcon category={txn.category} declined={declined || flagged} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{txn.merchant}</p>
        <p className={cx("truncate text-[13px]", declined ? "text-orange-2" : "text-muted")}>
          {declined ? txn.declineReason : `${CATEGORY_LABEL[txn.category]} · ${time(txn.at)}`}
          {flagged && " · over cap, flagged"}
        </p>
      </div>
      <div className="text-right">
        {declined ? (
          <>
            <p className="text-[15px] font-bold text-orange-2">Declined</p>
            <Money cents={txn.amount} className="text-[12px] text-faint line-through" />
          </>
        ) : (
          <>
            <Money cents={txn.amount} className="text-[15px] font-bold" />
            {txn.needsSlip && !txn.slipAttached ? (
              <Link href="/app/receipts" className="block text-[12px] font-semibold text-orange-2">
                Add slip
              </Link>
            ) : txn.slipAttached ? (
              <p className="text-[12px] text-teal">Slip matched</p>
            ) : null}
          </>
        )}
      </div>
    </li>
  );
}
