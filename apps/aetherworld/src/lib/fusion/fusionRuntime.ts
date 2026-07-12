// Fusion Runtime 总装：把五域 / 引擎权重 / 概念图 / 计算法链 / 常数约束串成一次调用。
// Chat 主链路只需要调 runFusionPlanning(raw, route) 一次即可。
import type { CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";
import type { FusionRuntimeInfo } from "./fusionTypes";
import { resolveFiveDomainCoordinate } from "./fiveDomainCoordinateResolver";
import { buildFiveDomainPrompt } from "./fiveDomainPromptBridge";
import { resolveEngineProfile, buildEngineWeightSummary, buildEngineWeightPrompt } from "./engineWeightResolver";
import { extractWebLcmConceptGraph } from "./webLcmConceptExtractor";
import { injectConceptContext } from "./webLcmContextInjector";
import { buildCrossDomainCalculusChain } from "./crossDomainCalculusChainBuilder";
import { describeChainForPrompt } from "./calculusChainExecutor";
import { applyConstantsUniverse } from "./constantsUniverseBridge";
import { buildFusionConstantsConstraintPrompt } from "./constantsUniverseConstraintBuilder";

export interface FusionPlanResult {
  info: FusionRuntimeInfo;
  /** 用于追加到 system prompt 的融合上下文片段 */
  fusionSystemPromptAddendum: string;
}

export function runFusionPlanning(raw: string, route: CalculusRoute): FusionPlanResult {
  // 1. WebLCM 概念图
  let conceptGraph;
  try {
    conceptGraph = extractWebLcmConceptGraph(raw);
  } catch {
    conceptGraph = { nodes: [], edges: [], summary: "概念图抽取失败，已降级为空图。", confidence: 0 };
  }

  // 2. 五域坐标
  const fiveDomain = resolveFiveDomainCoordinate(raw);

  // 3. 计算法链
  const chain = buildCrossDomainCalculusChain({ route, conceptGraph, fiveDomain });

  // 4. 引擎权重
  const profile = resolveEngineProfile({ raw, route });
  const engineSummary = buildEngineWeightSummary(profile);

  // 5. 常数宇宙
  const constants = applyConstantsUniverse();

  // 6. 组装 Prompt 注入片段
  const sections: string[] = [];
  sections.push(buildFiveDomainPrompt(fiveDomain));
  sections.push(buildEngineWeightPrompt(engineSummary));
  if (chain.steps.length) sections.push(describeChainForPrompt(chain));
  sections.push(injectConceptContext(conceptGraph).promptText);
  sections.push(buildFusionConstantsConstraintPrompt());

  return {
    info: {
      fiveDomain,
      engineProfile: engineSummary,
      chain,
      conceptGraph,
      appliedConstantGroups: constants.groups,
    },
    fusionSystemPromptAddendum: sections.join("\n\n"),
  };
}
