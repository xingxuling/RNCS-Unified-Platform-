// 数列记忆 ↔ Chat 上下文桥：构建"最近原文 + 检索摘要"压缩上下文
import { getSession } from "@/lib/chat/chatSessionEngine";
import type { ChatMessage } from "@/lib/chat/chatMessageEngine";
import type { CompressedChatContext } from "./sequenceMemoryTypes";
import { retrieveSequenceMemory } from "./sequenceMemoryRetriever";
import { buildSequenceMemoryPrompt } from "./sequenceMemoryPromptBridge";
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import type { CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";

function estimateTokens(s: string): number {
  return Math.ceil((s || "").length / 2);
}

function messageToText(m: ChatMessage): string {
  if (m.role === "user") return m.text ?? "";
  if (m.answerCard?.answer) return m.answerCard.answer;
  return m.text ?? "";
}

export interface BuildContextOptions {
  sessionId: string;
  raw: string;
  fusion?: FusionRuntimeInfo;
  route?: CalculusRoute;
  /** LIGHT_ANSWER 等轻量模式 */
  isLightAnswer?: boolean;
  /** 用户是否明确"继续刚才" */
  explicitContinue?: boolean;
  recentTurnCount?: number;
}

export function buildCompressedChatContext(opts: BuildContextOptions): CompressedChatContext {
  const safetyNotes: string[] = [];
  const sess = getSession(opts.sessionId);
  const allMessages = sess?.messages ?? [];

  // 1. 最近 N 轮原文
  const targetCount = opts.isLightAnswer ? 2 : opts.recentTurnCount ?? 4;
  // 取最后 N*2 条（user+assistant）但排除当前正在生成的最后两条
  const ended = allMessages.filter((m) => !m.streaming);
  const recent = ended.slice(-targetCount * 2);
  const recentTurns = recent
    .map((m) => ({
      role: m.role,
      content: messageToText(m),
    }))
    .filter((t) => t.content);

  const excludeMessageIds = recent.map((m) => m.id);
  const originalAllText = ended.map(messageToText).join("\n");
  const originalTokenEstimate = estimateTokens(originalAllText);

  // 2. 检索数列记忆
  let injectedMemories: CompressedChatContext["injectedMemories"] = [];
  let retrievalTimeMs = 0;
  try {
    let topK = opts.isLightAnswer ? (opts.explicitContinue ? 2 : 0) : 5;
    if (!opts.isLightAnswer && (opts.raw || "").length < 12) topK = 2;
    if (topK > 0) {
      const ret = retrieveSequenceMemory({
        sessionId: opts.sessionId,
        raw: opts.raw,
        conceptGraph: opts.fusion?.conceptGraph,
        fiveDomain: opts.fusion?.fiveDomain,
        route: opts.route,
        excludeMessageIds,
        topK,
        minScore: 0.35,
      });
      injectedMemories = ret.results.map((r) => r.unit);
      retrievalTimeMs = ret.retrievalTimeMs;
    }
  } catch (e: any) {
    safetyNotes.push("数列记忆检索失败，本轮跳过历史摘要。");
  }

  const memoryPromptText = buildSequenceMemoryPrompt(injectedMemories);

  // 3. 估算压缩 token
  const recentText = recentTurns.map((t) => t.content).join("\n");
  const compressedTokenEstimate = estimateTokens(recentText) + estimateTokens(memoryPromptText);
  const compressionRatio =
    originalTokenEstimate === 0 ? 0 : Math.max(0, 1 - compressedTokenEstimate / originalTokenEstimate);

  return {
    recentTurns,
    injectedMemories,
    memoryPromptText,
    metrics: {
      originalTokenEstimate,
      compressedTokenEstimate,
      compressionRatio,
      retrievalTimeMs,
      injectedMemoryCount: injectedMemories.length,
    },
    safetyNotes,
  };
}
