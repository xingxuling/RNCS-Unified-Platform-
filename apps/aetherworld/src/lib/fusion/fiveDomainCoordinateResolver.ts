// 五域坐标解析：从用户输入推出天 / 地 / 人 / 神 / 风的命中权重与解释。
import {
  FIVE_DOMAIN_CONSTANTS,
  type FiveDomainId,
} from "@/constants/fusion/fiveDomainConstants";
import type { FiveDomainCoordinate, FiveDomainCoordinateMap } from "./fusionTypes";

const BASE_WEIGHT = 0.15;

function interpret(domain: FiveDomainId, raw: string, hits: string[]): string {
  const trimmed = raw.length > 24 ? raw.slice(0, 24) + "…" : raw;
  const hitText = hits.length ? `命中：${hits.join(" / ")}` : "无明显信号";
  switch (domain) {
    case "HEAVEN":
      return `时机与窗口维度（${hitText}）。`;
    case "EARTH":
      return `承载与环境维度（${hitText}）。`;
    case "HUMAN":
      return `用户与角色维度（${hitText}）。`;
    case "SPIRIT":
      return `意义与规则维度（${hitText}）。`;
    case "WIND":
      return `传播与变化维度（${hitText}，原文：${trimmed}）。`;
  }
}

export function resolveFiveDomainCoordinate(raw: string): FiveDomainCoordinateMap {
  const text = raw.toLowerCase();
  const coords: FiveDomainCoordinate[] = FIVE_DOMAIN_CONSTANTS.map((d) => {
    const hits = d.keywords.filter((kw) => text.includes(kw.toLowerCase()));
    const weight = Math.min(1, BASE_WEIGHT + hits.length * 0.18);
    return {
      domain: d.id,
      label: d.label,
      weight,
      interpretation: interpret(d.id, raw, hits),
    };
  });

  const dominant = coords.reduce((a, b) => (b.weight > a.weight ? b : a));
  const sortedTop = [...coords].sort((a, b) => b.weight - a.weight).slice(0, 3);
  const summary = `主导域：${dominant.label}；次要：${sortedTop
    .slice(1)
    .map((c) => c.label)
    .join(" / ")}`;

  return { coordinates: coords, dominantDomain: dominant.domain, summary };
}
