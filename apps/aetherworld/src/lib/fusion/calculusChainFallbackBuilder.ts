// 计算法链 Fallback：模型不可用时，根据 fusion 结果输出结构化骨架。
import type { CrossDomainCalculusChain, FiveDomainCoordinateMap, WebLcmConceptGraph, EngineWeightSummary } from "./fusionTypes";
import { CALCULUS_LABEL } from "@/lib/chat/calculusRouteResultTypes";
import { CALCULUS_REGISTRY } from "@/lib/chat/calculusRouteRegistry";

export function buildCalculusChainFallbackAnswer(opts: {
  raw: string;
  chain: CrossDomainCalculusChain;
  fiveDomain: FiveDomainCoordinateMap;
  conceptGraph: WebLcmConceptGraph;
  engineSummary: EngineWeightSummary;
}): string {
  const { raw, chain, fiveDomain, conceptGraph, engineSummary } = opts;
  const lines: string[] = [];
  lines.push("本地模型暂不可用，已切换为「计算法链骨架」模式。以下结构由 fusion 层生成，可在模型恢复后继续展开。");
  lines.push("");
  lines.push(`· 原始问题：${raw}`);
  lines.push(`· 计算法链：${chain.steps.map((s) => CALCULUS_LABEL[s.calculusId]).join(" → ") || "—"}`);
  lines.push(`· 引擎权重：${engineSummary.primaryTop.map((e) => `${e.engineId} ${e.weight.toFixed(2)}`).join(" / ")}`);
  lines.push("");

  lines.push("## 五域坐标");
  fiveDomain.coordinates.forEach((c) => {
    lines.push(`- **${c.label}**（${(c.weight * 100).toFixed(0)}%）：${c.interpretation}`);
  });
  lines.push("");

  lines.push("## WebLCM 概念图");
  conceptGraph.nodes.slice(0, 6).forEach((n) => {
    lines.push(`- ${n.label} [${n.type}]`);
  });
  lines.push("");

  chain.steps.forEach((step) => {
    const def = CALCULUS_REGISTRY[step.calculusId];
    lines.push(`## ${CALCULUS_LABEL[step.calculusId]}`);
    def.requiredSections.forEach((s) => {
      lines.push(`### ${s}`);
      lines.push("（待模型补全 / 可手动填写）");
    });
    lines.push("");
  });

  lines.push("## 下一步");
  if (chain.steps.length) {
    const last = CALCULUS_REGISTRY[chain.steps[chain.steps.length - 1].calculusId];
    last.nextActions.forEach((a) => lines.push(`- ${a}`));
  } else {
    lines.push("- 补充更具体目标（应用 / 代码 / 世界 / 歌曲 / 数列 / 提醒 / 发布）");
  }
  return lines.join("\n");
}
