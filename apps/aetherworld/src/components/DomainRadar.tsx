import type { DomainScores } from "@/lib/predictionEngine";
import { DOMAIN_META, DOMAINS } from "@/constants/types";

interface Props {
  scores: DomainScores;
  size?: number;
}

export function DomainRadar({ scores, size = 220 }: Props) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 24;
  const angles = DOMAINS.map((_, i) => (-Math.PI / 2) + (i * 2 * Math.PI) / 5);
  const point = (val: number, i: number) => {
    const rr = (val / 100) * r;
    return [cx + Math.cos(angles[i]) * rr, cy + Math.sin(angles[i]) * rr] as const;
  };

  const polygon = DOMAINS.map((d, i) => point(scores[d], i).join(",")).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 同心环 */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={DOMAINS.map((_, i) => point(f * 100, i).join(",")).join(" ")}
          fill="none"
          stroke="oklch(1 0 0 / 0.07)"
          strokeWidth={1}
        />
      ))}
      {/* 轴 */}
      {DOMAINS.map((_, i) => {
        const [x, y] = point(100, i);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="oklch(1 0 0 / 0.06)" />;
      })}
      {/* 数据多边形 */}
      <polygon
        points={polygon}
        fill="oklch(0.86 0.09 86 / 0.15)"
        stroke="oklch(0.86 0.09 86 / 0.8)"
        strokeWidth={1.5}
      />
      {/* 顶点 */}
      {DOMAINS.map((d, i) => {
        const [x, y] = point(scores[d], i);
        return <circle key={d} cx={x} cy={y} r={3} fill={DOMAIN_META[d].colorVar} />;
      })}
      {/* 标签 */}
      {DOMAINS.map((d, i) => {
        const [x, y] = point(120, i);
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="12"
            fill={DOMAIN_META[d].colorVar}
            fontFamily="var(--font-display)"
          >
            {DOMAIN_META[d].name}
          </text>
        );
      })}
    </svg>
  );
}
