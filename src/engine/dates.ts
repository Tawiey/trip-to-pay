/** Date helpers for local ISO strings (YYYY-MM-DD / YYYY-MM-DDTHH:mm). */
export function dayOf(isoDateTime: string): string {
  return isoDateTime.slice(0, 10);
}

/** Whole days from a to b (b − a), both YYYY-MM-DD. */
export function daysBetween(a: string, b: string): number {
  const ms = Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10)) -
    Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  return Math.round(ms / 86_400_000);
}

export function addDays(date: string, n: number): string {
  const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10) + n));
  return d.toISOString().slice(0, 10);
}
