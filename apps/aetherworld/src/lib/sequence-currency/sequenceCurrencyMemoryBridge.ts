// 数列记忆压缩 → 数列货币系统的「节省价值」事件桥。
// 仅在压缩比有意义时写入一笔轻量贡献，避免污染账本。
import { recordContribution } from "@/lib/currency/sequenceCurrencyEngine";
import { isFounderActive } from "@/lib/founderCalculus";
import type { ChatMemorySummary } from "@/lib/sequence-memory/sequenceMemoryTypes";

export interface MemoryCurrencyEventInput {
  chatSessionId: string;
  messageId: string;
  memory: ChatMemorySummary;
  tokensBefore?: number;
  tokensAfter?: number;
}

export interface MemoryCurrencyInfo {
  recorded: boolean;
  ledgerEntryIds: string[];
  savedTokens?: number;
  compressionRatio: number;
  unitCount: number;
}

export function recordMemoryCompressionCurrencyEvent(
  input: MemoryCurrencyEventInput,
): MemoryCurrencyInfo {
  const m = input.memory;
  if (!m.created || m.unitCount <= 0) {
    return {
      recorded: false,
      ledgerEntryIds: [],
      compressionRatio: m.compressionRatio,
      unitCount: m.unitCount,
    };
  }
  const savedTokens =
    typeof input.tokensBefore === "number" && typeof input.tokensAfter === "number"
      ? Math.max(0, input.tokensBefore - input.tokensAfter)
      : undefined;
  const userMode = isFounderActive() ? "FOUNDER" : "LIGHT_20";
  try {
    const res = recordContribution({
      contributionType: "SIMPLIFY_LANGUAGE",
      userMode,
      qualityScore: 5,
      usefulnessScore: 6,
      validationScore: 5,
      complexityScore: 3,
      safetyScore: m.safetyStatus === "BLOCK" ? 2 : m.safetyStatus === "WARN" ? 5 : 8,
      duplicationRisk: 0,
      description: `数列记忆压缩：压缩率 ${(m.compressionRatio * 100).toFixed(0)}%，生成 ${m.unitCount} 条记忆`,
      sourceEngine: "SequenceMemoryCompressor",
      sourceId: m.sequenceCodes[0] ?? input.messageId,
    });
    return {
      recorded: res.ledgerEntries.length > 0,
      ledgerEntryIds: res.ledgerEntries.map((e) => e.id),
      savedTokens,
      compressionRatio: m.compressionRatio,
      unitCount: m.unitCount,
    };
  } catch {
    return {
      recorded: false,
      ledgerEntryIds: [],
      savedTokens,
      compressionRatio: m.compressionRatio,
      unitCount: m.unitCount,
    };
  }
}
