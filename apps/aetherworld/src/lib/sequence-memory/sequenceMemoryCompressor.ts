// 数列记忆压缩器：把单轮对话 + Fusion Info 压成 1 个 SequenceMemoryUnit
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import type { CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";
import type {
  SequenceMemoryCompressionResult,
  SequenceMemoryUnit,
  SequenceMemoryFiveDomain,
} from "./sequenceMemoryTypes";
import { filterMemoryText } from "./sequenceMemorySafetyFilter";
import { saveSequenceMemoryUnit } from "./sequenceMemoryStore";

export interface CompressInput {
  chatSessionId: string;
  userMessageId: string;
  assistantMessageId: string;
  userText: string;
  assistantText: string;
  fusionInfo?: FusionRuntimeInfo;
  route?: CalculusRoute;
  domain?: string;
  outputType?: string;
  safetyNotes?: string[];
}

function estimateTokens(s: string): number {
  if (!s) return 0;
  // 粗估：中英混合按 1 字 ≈ 1 token 上限，英文按 1 词≈1.3 token
  return Math.ceil(s.length / 2);
}

function hash6(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(36).toLowerCase().padStart(4, "0").slice(0, 4);
}

function shortCalculus(calculusIds: string[]): string {
  if (!calculusIds.length) return "GENERIC";
  const tokens = calculusIds.slice(0, 2).map((id) => {
    const parts = id.replace(/_CALCULUS$/, "").split("_");
    return parts.map((p) => p.slice(0, 4)).join("").toUpperCase();
  });
  return tokens.join("_").slice(0, 12) || "GENERIC";
}

function buildSequenceCode(domain: string, calculusIds: string[], seed: string): string {
  const d = (domain || "GEN").toUpperCase().slice(0, 6);
  const c = shortCalculus(calculusIds);
  return `SMU-${d}-${c}-${hash6(seed)}-v1`;
}

function buildTitle(userText: string, route?: CalculusRoute): string {
  const head = userText.trim().slice(0, 24).replace(/\s+/g, " ");
  if (head) return head + (userText.length > 24 ? "…" : "");
  return route?.calculusIds[0] ?? "对话片段";
}

function buildStructuredSummary(opts: {
  userText: string;
  assistantText: string;
  fusion?: FusionRuntimeInfo;
  route?: CalculusRoute;
  outputType?: string;
}): string {
  const { userText, assistantText, fusion, route, outputType } = opts;
  const lines: string[] = [];

  lines.push(`· 目标：${userText.slice(0, 80)}${userText.length > 80 ? "…" : ""}`);

  if (route?.calculusIds.length) {
    lines.push(`· 计算法：${route.calculusIds.join(" → ")}`);
  }

  if (fusion?.fiveDomain?.dominantDomain) {
    lines.push(`· 主导域：${fusion.fiveDomain.dominantDomain}`);
  }

  if (fusion?.engineProfile?.primaryTop?.length) {
    const top = fusion.engineProfile.primaryTop
      .slice(0, 3)
      .map((e) => `${e.engineId}${e.weight.toFixed(2)}`)
      .join(" / ");
    lines.push(`· 引擎：${top}`);
  }

  if (fusion?.conceptGraph?.nodes?.length) {
    const labels = fusion.conceptGraph.nodes.slice(0, 6).map((n) => n.label).join(" / ");
    lines.push(`· 关键概念：${labels}`);
  }

  if (outputType) lines.push(`· 输出类型：${outputType}`);

  // 决策与下一步：抽 assistant 的标题行 / 第一句
  const decisionSnippet = assistantText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("```"))
    .slice(0, 3)
    .join(" / ");
  if (decisionSnippet) lines.push(`· 结论：${decisionSnippet.slice(0, 160)}${decisionSnippet.length > 160 ? "…" : ""}`);

  return lines.join("\n");
}

export function compressChatTurnToSequenceMemory(input: CompressInput): SequenceMemoryCompressionResult {
  const start = performance.now();
  const safetyNotes = [...(input.safetyNotes ?? [])];

  const userFilt = filterMemoryText(input.userText || "");
  const asstFilt = filterMemoryText(input.assistantText || "");
  safetyNotes.push(...userFilt.notes, ...asstFilt.notes);

  // BLOCK：不创建 Unit
  if (userFilt.forbid || asstFilt.forbid) {
    return {
      createdUnits: [],
      updatedUnits: [],
      compressionRatio: 0,
      originalTokenEstimate: estimateTokens(input.userText + input.assistantText),
      compressedTokenEstimate: 0,
      safetyNotes: [...safetyNotes, "Founder-only / 私密内容，未创建数列记忆。"],
      compressionTimeMs: Math.round(performance.now() - start),
    };
  }

  const fusion = input.fusionInfo;
  const route = input.route;
  const calculusIds = (route?.calculusIds ?? []) as string[];
  const domain = input.domain ?? "GENERIC";

  const summary = buildStructuredSummary({
    userText: userFilt.text,
    assistantText: asstFilt.text,
    fusion,
    route,
    outputType: input.outputType,
  });

  const fiveDomain: SequenceMemoryFiveDomain = {
    dominant: fusion?.fiveDomain?.dominantDomain,
  };
  fusion?.fiveDomain?.coordinates.forEach((c) => {
    const key = c.domain.toLowerCase() as keyof SequenceMemoryFiveDomain;
    if (key === "heaven" || key === "earth" || key === "human" || key === "spirit" || key === "wind") {
      (fiveDomain as any)[key] = `${c.label}:${(c.weight * 100).toFixed(0)}%`;
    }
  });

  const conceptNodes = fusion?.conceptGraph?.nodes.slice(0, 12).map((n) => n.label) ?? [];
  const engineIds = fusion?.engineProfile?.activeEngines.slice(0, 6).map((e) => e.engineId) ?? [];
  const outputTypes = input.outputType ? [input.outputType] : [];

  const now = new Date().toISOString();
  const id = `SMU-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const sequenceCode = buildSequenceCode(domain, calculusIds, input.userText + input.assistantMessageId);

  const importance = Math.min(
    1,
    0.4 +
      (calculusIds.length ? 0.15 : 0) +
      (conceptNodes.length >= 4 ? 0.15 : 0) +
      (input.outputType && input.outputType !== "TEXT" ? 0.2 : 0),
  );

  const unit: SequenceMemoryUnit = {
    id,
    chatSessionId: input.chatSessionId,
    sourceMessageIds: [input.userMessageId, input.assistantMessageId],
    sequenceCode,
    title: buildTitle(userFilt.text, route),
    summary,
    domain,
    calculusIds,
    fiveDomain,
    conceptNodes,
    engineIds,
    outputTypes,
    importance,
    recencyScore: 1,
    reuseCount: 0,
    safetyStatus: userFilt.status === "WARN" || asstFilt.status === "WARN" ? "WARN" : "PASS",
    createdAt: now,
    updatedAt: now,
  };

  saveSequenceMemoryUnit(unit);

  const originalTokenEstimate = estimateTokens(input.userText + "\n" + input.assistantText);
  const compressedTokenEstimate = estimateTokens(summary);
  const compressionRatio =
    originalTokenEstimate === 0 ? 0 : 1 - compressedTokenEstimate / originalTokenEstimate;

  return {
    createdUnits: [unit],
    updatedUnits: [],
    compressionRatio: Math.max(0, Math.min(1, compressionRatio)),
    originalTokenEstimate,
    compressedTokenEstimate,
    safetyNotes,
    compressionTimeMs: Math.round(performance.now() - start),
  };
}
