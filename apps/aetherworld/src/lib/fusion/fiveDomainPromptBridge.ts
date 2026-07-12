// 把五域坐标转为 Prompt 注入片段。
import type { FiveDomainCoordinateMap } from "./fusionTypes";

export function buildFiveDomainPrompt(map: FiveDomainCoordinateMap): string {
  const lines: string[] = [];
  lines.push("【五域坐标 · 天/地/人/神/风】");
  map.coordinates.forEach((c) => {
    const w = (c.weight * 100).toFixed(0);
    lines.push(`- ${c.label}（权重 ${w}%）：${c.interpretation}`);
  });
  lines.push(`主导域：${map.dominantDomain}。请回答时优先围绕主导域展开，但兼顾其他四域的影响。`);
  return lines.join("\n");
}
