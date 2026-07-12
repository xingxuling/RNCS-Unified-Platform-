// 把 WebLCM 概念图作为 Prompt 上下文注入器。
import type { WebLcmConceptGraph } from "./fusionTypes";
import { buildConceptGraphPrompt } from "./webLcmConceptGraphBridge";

export interface InjectedConceptContext {
  promptText: string;
  topNodeLabels: string[];
}

export function injectConceptContext(graph: WebLcmConceptGraph): InjectedConceptContext {
  const top = [...graph.nodes].sort((a, b) => b.weight - a.weight).slice(0, 4);
  return {
    promptText: buildConceptGraphPrompt(graph),
    topNodeLabels: top.map((n) => n.label),
  };
}
