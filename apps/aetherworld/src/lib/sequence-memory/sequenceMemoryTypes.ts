// 数列记忆压缩 v0.1 — 共享类型
import type { CalculusId } from "@/lib/chat/calculusRouteResultTypes";
import type { FiveDomainId } from "@/constants/fusion/fiveDomainConstants";

export type SequenceMemorySafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface SequenceMemoryFiveDomain {
  heaven?: string;
  earth?: string;
  human?: string;
  spirit?: string;
  wind?: string;
  dominant?: FiveDomainId;
}

export interface SequenceMemoryUnit {
  id: string;
  chatSessionId: string;
  sourceMessageIds: string[];
  sequenceCode: string;
  title: string;
  summary: string;
  domain: string;
  calculusIds: CalculusId[] | string[];
  fiveDomain: SequenceMemoryFiveDomain;
  conceptNodes: string[];
  engineIds: string[];
  outputTypes: string[];
  importance: number; // 0~1
  recencyScore: number; // 0~1
  reuseCount: number;
  safetyStatus: SequenceMemorySafetyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SequenceMemoryCompressionResult {
  createdUnits: SequenceMemoryUnit[];
  updatedUnits: SequenceMemoryUnit[];
  compressionRatio: number; // 0~1，越小越压缩
  originalTokenEstimate: number;
  compressedTokenEstimate: number;
  safetyNotes: string[];
  compressionTimeMs: number;
}

export interface CompressedChatContext {
  /** 最近 N 轮原文（system / user / assistant 顺序保留） */
  recentTurns: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  /** 注入的数列记忆摘要（已脱敏） */
  injectedMemories: SequenceMemoryUnit[];
  /** 模型 system prompt 中可直接拼入的「数列记忆」片段 */
  memoryPromptText: string;
  /** 性能指标 */
  metrics: {
    originalTokenEstimate: number;
    compressedTokenEstimate: number;
    compressionRatio: number;
    retrievalTimeMs: number;
    injectedMemoryCount: number;
  };
  safetyNotes: string[];
}

export interface ChatMemorySummary {
  /** 本轮是否生成记忆 */
  created: boolean;
  unitCount: number;
  sequenceCodes: string[];
  compressionRatio: number;
  injectedMemoryCount: number;
  safetyStatus: SequenceMemorySafetyStatus;
  notes: string[];
}
