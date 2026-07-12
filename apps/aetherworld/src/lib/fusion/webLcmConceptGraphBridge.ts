// WebLCM 概念图 → Chat 路由层桥接：从概念图反推可能的 Calculus / 五域权重补偿。
import type { WebLcmConceptGraph } from "./fusionTypes";
import type { CalculusId } from "@/lib/chat/calculusRouteResultTypes";
import type { FiveDomainId } from "@/constants/fusion/fiveDomainConstants";

export interface ConceptGraphRoutingHint {
  suggestedCalculus: CalculusId[];
  domainBoost: Partial<Record<FiveDomainId, number>>;
  toolSuggestions: string[];
}

export function inferRoutingHint(graph: WebLcmConceptGraph): ConceptGraphRoutingHint {
  const labels = graph.nodes.map((n) => n.label.toLowerCase()).join(" | ");
  const suggested: CalculusId[] = [];
  const boost: Partial<Record<FiveDomainId, number>> = {};
  const tools: string[] = [];

  if (/app|应用|番茄/.test(labels)) {
    suggested.push("APP_RUNTIME_CALCULUS");
    boost.EARTH = (boost.EARTH ?? 0) + 0.15;
    tools.push("appRuntime.createDraft");
  }
  if (/代码|patch|修复|sandbox/.test(labels)) {
    suggested.push("CODE_SANDBOX_CALCULUS");
    tools.push("codeSandbox.createRun");
  }
  if (/世界|蓝天机|宇宙/.test(labels)) {
    suggested.push("WORLD_ENGINE_CALCULUS");
    boost.SPIRIT = (boost.SPIRIT ?? 0) + 0.15;
  }
  if (/歌|歌曲|主题曲|歌词/.test(labels)) {
    suggested.push("VOCAL_ENGINE_CALCULUS");
    boost.WIND = (boost.WIND ?? 0) + 0.15;
  }
  if (/工作区|workspace/.test(labels)) {
    tools.push("workspace.saveObject");
  }
  if (/发布|分享|社交/.test(labels)) {
    suggested.push("SOCIAL_PUBLISH_CALCULUS");
    tools.push("social.createDraft");
  }
  if (/提醒|日历|明天|今晚|下周/.test(labels)) {
    suggested.push("CALENDAR_TRIGGER_CALCULUS");
    tools.push("calendar.createTask");
    boost.HEAVEN = (boost.HEAVEN ?? 0) + 0.2;
  }

  return {
    suggestedCalculus: Array.from(new Set(suggested)),
    domainBoost: boost,
    toolSuggestions: Array.from(new Set(tools)),
  };
}

export function buildConceptGraphPrompt(graph: WebLcmConceptGraph): string {
  const topNodes = [...graph.nodes].sort((a, b) => b.weight - a.weight).slice(0, 6);
  const lines: string[] = [];
  lines.push("【WebLCM 概念图（压缩上下文）】");
  topNodes.forEach((n) => lines.push(`- ${n.label} [${n.type}] · 权重 ${n.weight.toFixed(2)}`));
  lines.push(`摘要：${graph.summary}（置信度 ${graph.confidence.toFixed(2)}）`);
  return lines.join("\n");
}
