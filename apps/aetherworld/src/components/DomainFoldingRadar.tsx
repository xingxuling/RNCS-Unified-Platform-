import { FOLD_DOMAINS } from "@/constants/domainFactors";
import type { DomainScoresMap } from "@/lib/domainFolding";

export function DomainFoldingRadar({ scores, size = 240 }: { scores: DomainScoresMap; size?: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size / 2 - 24;
  const items = FOLD_DOMAINS;
  const n = items.length;
  const pts = items.map((d, i) => {
    const v = (scores[d.key] ?? 0) / 100;
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = r * Math.max(0.08, v);
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  });
  const axes = items.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  const labels = items.map((d, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(a) * (r + 14), y: cy + Math.sin(a) * (r + 14), name: d.name, neg: !!d.isNegative };
  });

  return (
    <svg width={size} height={size} className="overflow-visible">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke="var(--starline)" strokeOpacity={0.2} />
      ))}
      {axes.map(([x, y], i) => (
        <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--starline)" strokeOpacity={0.15} />
      ))}
      <polygon
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="var(--gold)"
        fillOpacity={0.18}
        stroke="var(--gold)"
        strokeWidth={1.2}
      />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2.5} fill="var(--gold)" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
              fontSize="10" fill={l.neg ? "var(--destructive)" : "var(--muted-foreground)"}>
          {l.name}
        </text>
      ))}
    </svg>
  );
}
