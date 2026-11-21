import { cx } from "@/components/ui/cx";

/** Stylised street-grid map with the GPS route, as in the concept deck. */
export function RouteMap({ route, className, animate, progress = 1 }: { route: [number, number][]; className?: string; animate?: boolean; progress?: number }) {
  const W = 300;
  const H = 160;
  const pts = route.map(([x, y]) => [x * W, y * H] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const len = pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
  const end = pts[pts.length - 1];
  const start = pts[0];
  const blocks: { x: number; y: number; w: number; h: number }[] = [];
  const cols = [0, 64, 138, 214, 300];
  const rows = [0, 48, 104, 160];
  for (let c = 0; c < cols.length - 1; c++)
    for (let r = 0; r < rows.length - 1; r++) blocks.push({ x: cols[c] + 5, y: rows[r] + 5, w: cols[c + 1] - cols[c] - 10, h: rows[r + 1] - rows[r] - 10 });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cx("w-full rounded-2xl bg-white", className)} role="img" aria-label="GPS route map">
      {blocks.map((b, i) => (
        <rect key={i} {...b} rx={6} className="fill-mist" />
      ))}
      {pts.length > 1 && (
        <>
          <path
            d={d}
            fill="none"
            className="stroke-teal"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={len}
            strokeDashoffset={animate ? len : len * (1 - progress)}
            style={animate ? { animation: "dash 1.6s ease-out forwards" } : { transition: "stroke-dashoffset 0.25s linear" }}
          />
          <circle cx={start[0]} cy={start[1]} r={7} className="fill-ink" />
          {progress >= 1 && <circle cx={end[0]} cy={end[1]} r={7} className="fill-orange stroke-white" strokeWidth={2} />}
        </>
      )}
    </svg>
  );
}
