import { Banknote, Bed, Car, Clapperboard, Fuel, ParkingSquare, ShoppingBag, UtensilsCrossed, Wine } from "lucide-react";
import type { MerchantCategory } from "@/engine/types";
import { cx } from "@/components/ui/cx";

const ICONS = {
  meals: UtensilsCrossed,
  transport: Car,
  lodging: Bed,
  fuel: Fuel,
  parking: ParkingSquare,
  incidentals: ShoppingBag,
  alcohol: Wine,
  entertainment: Clapperboard,
  cash: Banknote,
} satisfies Record<MerchantCategory, unknown>;

export function CategoryIcon({ category, declined, className }: { category: MerchantCategory; declined?: boolean; className?: string }) {
  const Icon = ICONS[category];
  return (
    <span
      className={cx(
        "grid size-10 shrink-0 place-items-center rounded-xl",
        declined ? "bg-orange-soft text-orange-2" : "bg-teal-soft text-teal",
        className,
      )}
    >
      <Icon size={18} strokeWidth={2} />
    </span>
  );
}
