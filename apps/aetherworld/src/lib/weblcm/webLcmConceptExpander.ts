import type { AetherConceptChain, ConceptExpansionPlan } from "./webLcmTypes";
import { newId } from "./webLcmTypes";

export type ExpansionTargetEngine =
  | "WEBLLM" | "APP_RUNTIME" | "CODE_SANDBOX" | "VOCAL_ENGINE"
  | "NARRATIVE_ENGINE" | "PROMPT_FORGE" | "CROSS_FUNCTIONAL_WORKFLOW" | "DIGITAL_ROLE_WORKFLOW";

export interface ExpandOptions {
  targetEngine?: ExpansionTargetEngine;
  outputContract?: string[];
}

export function buildExpansionPlan(chain: AetherConceptChain, opts: ExpandOptions = {}): ConceptExpansionPlan {
  const target = opts.targetEngine ?? "WEBLLM";
  const prompt = [
    `# 概念展开任务`,
    `目标引擎：${target}`,
    `概念链：${chain.compressionSummary}`,
    ``,
    `## 核心概念`,
    ...chain.orderedConcepts.slice(0, 8).map((c, i) => `${i + 1}. [${c.conceptType}] ${c.title} — ${c.summary}`),
    ``,
    `## 输出契约`,
    ...(opts.outputContract ?? ["保持概念链不漂移", "标注不确定性", "遵循 System Constitution"]).map(c => `- ${c}`),
    ``,
    `## 安全规则`,
    `- 不得现实化虚拟世界。`,
    `- 不得泄漏 Founder-only / Full60 原文。`,
    `- 概念预测非现实确定性。`,
  ].join("\n");
  return {
    expansionId: newId("exp"),
    sourceChainId: chain.chainId,
    targetEngine: target,
    expansionPrompt: prompt,
    requiredObjects: chain.sourceConceptIds,
    outputContract: opts.outputContract ?? ["不漂移", "可审计", "可回溯"],
    safetyRules: ["NO_PRIVACY_TO_LLM", "NO_VIRTUAL_AS_REAL", "NO_PREDICTION_AS_FACT"],
  };
}
