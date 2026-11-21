const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-14" → "14 Oct" */
export function shortDate(iso: string): string {
  return `${+iso.slice(8, 10)} ${MONTHS[+iso.slice(5, 7) - 1]}`;
}

/** Trip range "14–16 Oct" or "30 Sep – 2 Oct" */
export function dateRange(a: string, b: string): string {
  if (a === b) return shortDate(a);
  if (a.slice(0, 7) === b.slice(0, 7)) return `${+a.slice(8, 10)}–${shortDate(b)}`;
  return `${shortDate(a)} – ${shortDate(b)}`;
}

export function time(iso: string): string {
  return iso.slice(11, 16);
}

export function weekday(iso: string): string {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)));
  return WEEKDAYS[d.getUTCDay()];
}

/** "Thu 15 Oct · 14:00" */
export function clockLabel(iso: string): string {
  return `${weekday(iso)} ${shortDate(iso)} · ${time(iso)}`;
}

export function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export function shortName(name: string): string {
  const [first, ...rest] = name.split(" ");
  return `${first[0]}. ${rest.join(" ")}`;
}
