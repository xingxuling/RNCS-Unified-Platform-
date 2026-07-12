// Cross-Domain Calculus Chain Builder
// 把现有 CalculusRoute + 概念图 hint + 五域坐标 合成一条带 SERIAL / PARALLEL / ORTHOGONAL 模式的链。
import type { CalculusId, CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";
import type { CrossDomainCalculusChain, CalculusChainStep, WebLcmConceptGraph, FiveDomainCoordinateMap } from "./fusionTypes";
import { inferRoutingHint } from "./webLcmConceptGraphBridge";

// 命名模板：服务于 fallback 与 UI 展示
export const CHAIN_TEMPLATES: { id: string; steps: CalculusId[]; reason: string }[] = [
  { id: "APP_CHAIN", steps: ["APP_RUNTIME_CALCULUS", "CODE_SANDBOX_CALCULUS"], reason: "应用 → 代码沙箱 → 工作区保存" },
  { id: "WORLD_SONG_CHAIN", steps: ["WORLD_ENGINE_CALCULUS", "NARRATIVE_CALCULUS", "VOCAL_ENGINE_CALCULUS"], reason: "世界 → 叙事 → 声乐" },
  { id: "SEQUENCE_APP_CHAIN", steps: ["SEQUENCE_TASK_CALCULUS", "APP_RUNTIME_CALCULUS", "SOCIAL_PUBLISH_CALCULUS"], reason: "数列 → 应用 → 社交发布" },
  { id: "CALENDAR_WORLD_CHAIN", steps: ["CALENDAR_TRIGGER_CALCULUS", "WORLD_ENGINE_CALCULUS", "NARRATIVE_CALCULUS"], reason: "日历 → 世界 → 叙事" },
  { id: "SOCIAL_GOVERN_CHAIN", steps: ["SOCIAL_PUBLISH_CALCULUS", "GOVERNANCE_CALCULUS"], reason: "社交 → 治理" },
  { id: "STORE_CHAIN", steps: ["STORE_CAPABILITY_CALCULUS", "GOVERNANCE_CALCULUS"], reason: "商店 → 权限治理" },
  { id: "CODE_REPAIR_CHAIN", steps: ["CODE_SANDBOX_CALCULUS", "GOVERNANCE_CALCULUS"], reason: "代码沙箱 → QA 治理" },
];

function newChainId(): string {
  return `chain_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 5)}`;
}

export function buildCrossDomainCalculusChain(opts: {
  route: CalculusRoute;
  conceptGraph: WebLcmConceptGraph;
  fiveDomain: FiveDomainCoordinateMap;
}): CrossDomainCalculusChain {
  const { route, conceptGraph, fiveDomain } = opts;
  const hint = inferRoutingHint(conceptGraph);

  // 合并：route.calculusIds + hint.suggested（去重，保持顺序）
  const merged: CalculusId[] = [];
  [...route.calculusIds, ...hint.suggestedCalculus].forEach((id) => {
    if (!merged.includes(id)) merged.push(id);
  });

  // 没命中任何 calculus：根据主导域兜底
  if (merged.length === 0) {
    if (fiveDomain.dominantDomain === "HEAVEN") merged.push("CALENDAR_TRIGGER_CALCULUS");
    else if (fiveDomain.dominantDomain === "EARTH") merged.push("APP_RUNTIME_CALCULUS");
    else if (fiveDomain.dominantDomain === "WIND") merged.push("SOCIAL_PUBLISH_CALCULUS");
    else if (fiveDomain.dominantDomain === "SPIRIT") merged.push("WORLD_ENGINE_CALCULUS");
  }

  // 尝试匹配命名模板
  const tpl = CHAIN_TEMPLATES.find((t) =>
    t.steps.every((s, i) => merged[i] === s) ||
    (t.steps.length === merged.length && t.steps.every((s) => merged.includes(s))),
  );

  // 模式判定：>=2 个 → SERIAL；同步参与 → PARALLEL（暂以 SERIAL 为主）
  const steps: CalculusChainStep[] = merged.map((id, i) => ({
    calculusId: id,
    mode: i === 0 ? "SERIAL" : "SERIAL",
  }));

  const orthogonal = [
    "ConstantsUniverse",
    "FiveDomainCoordinate",
    "WebLcmConceptGraph",
    "SequenceFingerprint",
  ];

  const reason = tpl
    ? `命中模板：${tpl.id}（${tpl.reason}）`
    : merged.length
    ? `按概念图与五域坐标合成链：${merged.join(" → ")}`
    : "未命中链路模板，使用轻量路径。";

  return {
    chainId: newChainId(),
    templateId: tpl?.id,
    steps,
    orthogonalInjections: orthogonal,
    reason,
  };
}
