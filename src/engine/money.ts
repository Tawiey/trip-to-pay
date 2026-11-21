/** All money in the engine is integer cents (ZAR). */
export type Cents = number;

export function rands(n: number): Cents {
  return Math.round(n * 100);
}

function groupThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Formats cents as South African rand, e.g. 113940 → "R 1 139.40". */
export function formatZAR(c: Cents, opts: { whole?: boolean } = {}): string {
  const sign = c < 0 ? "-" : "";
  const abs = Math.abs(Math.round(c));
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const body = opts.whole
    ? groupThousands(Math.round(abs / 100))
    : `${groupThousands(whole)}.${String(fraction).padStart(2, "0")}`;
  return `${sign}R ${body}`;
}
