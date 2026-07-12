// Chat 模型调用 → 既有数列货币系统的接入桥（不重新发明账本）。
// 复用 src/lib/currency/sequenceCurrencyEngine 中的 recordContribution。
import { recordContribution } from "@/lib/currency/sequenceCurrencyEngine";
import type { ContributionTypeId } from "@/constants/currency/contributionTypes";
import { isFounderActive } from "@/lib/founderCalculus";
import type { CalculusId, CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";

export interface ChatCurrencyEventInput {
  chatSessionId: string;
  messageId: string;
  userMessageId?: string;
  providerId?: string;
  providerName?: string;
  modelId?: string;
  latencyMs?: number;
  tokenEstimate?: number;
  promptMode?: string;
  calculusRoute?: CalculusRoute;
  fusion?: FusionRuntimeInfo;
  safetyStatus?: "PASS" | "WARN" | "BLOCK";
  outputType?: string;
  rawInput?: string;
}

export interface ChatCurrencyInfo {
  recorded: boolean;
  contributionType: ContributionTypeId;
  awardedUnits: { unitType: string; amount: number }[];
  ledgerEntryIds: string[];
  subjectMode: "DEMO" | "REAL" | "FOUNDER";
  providerName?: string;
  modelId?: string;
  latencyMs?: number;
  tokenEstimate?: number;
  chainSummary?: string;
  reason?: string;
  notes: string[];
}

function pickContributionType(calcIds: CalculusId[] | undefined): ContributionTypeId {
  if (!calcIds || !calcIds.length) return "CREATE_PROMPT";
  if (calcIds.includes("WORLD_ENGINE_CALCULUS")) return "CREATE_WORLD";
  if (calcIds.includes("NARRATIVE_CALCULUS")) return "CREATE_NARRATIVE";
  if (calcIds.includes("VOCAL_ENGINE_CALCULUS")) return "CREATE_VOCAL_PROMPT";
  if (calcIds.includes("CODE_SANDBOX_CALCULUS")) return "RUN_QA";
  if (calcIds.includes("APP_RUNTIME_CALCULUS")) return "CREATE_PROMPT";
  if (calcIds.includes("GOVERNANCE_CALCULUS")) return "RUN_QA";
  return "CREATE_PROMPT";
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}

function estimateTokens(text: string): number {
  // 简易估算：中文 ~1.5 字/Token，英文 ~4 字符/Token，取折中。
  if (!text) return 0;
  return Math.round(text.length / 2.2);
}

export function recordChatRunCurrencyEvent(input: ChatCurrencyEventInput): ChatCurrencyInfo {
  const calcIds = input.calculusRoute?.calculusIds;
  const contributionType = pickContributionType(calcIds);
  const chainLen = input.fusion?.chain.steps.length ?? 0;
  const engineCount = input.fusion?.engineProfile.activeEngines.length ?? 0;
  const conceptCount = input.fusion?.conceptGraph.nodes.length ?? 0;

  const complexityScore = clamp10(3 + chainLen * 0.9 + engineCount * 0.3);
  const usefulnessScore = clamp10(5 + (conceptCount > 0 ? 1 : 0) + (input.safetyStatus === "PASS" ? 1 : 0));
  const qualityScore = clamp10(5 + (input.providerId ? 1 : 0));
  const validationScore = clamp10(4 + (input.fusion?.drift && input.fusion.drift.severity === "NONE" ? 1 : 0));
  const safetyScore =
    input.safetyStatus === "BLOCK" ? 2 :
    input.safetyStatus === "WARN" ? 5 : 8;

  const subjectMode: "DEMO" | "REAL" | "FOUNDER" = isFounderActive() ? "FOUNDER" : "REAL";
  const userMode = subjectMode === "FOUNDER" ? "FOUNDER" : "LIGHT_20";

  const chainSummary = input.fusion
    ? input.fusion.chain.steps.map((s) => s.calculusId.replace(/_CALCULUS$/, "")).join(" → ")
    : undefined;

  const rawTrim = (input.rawInput ?? "").slice(0, 60);
  const description = [
    `Chat 模型调用：${input.providerName ?? "未知 Provider"} / ${input.modelId ?? "?"}`,
    chainSummary ? `链：${chainSummary}` : "",
    rawTrim ? `提问：${rawTrim}` : "",
  ].filter(Boolean).join(" · ");

  const notes: string[] = [];
  try {
    const res = recordContribution({
      contributionType,
      userMode,
      qualityScore,
      usefulnessScore,
      validationScore,
      complexityScore,
      safetyScore,
      duplicationRisk: 0,
      description,
      sourceEngine: "AetherChat",
      sourceId: input.messageId,
      extraText: rawTrim,
    });
    return {
      recorded: res.ledgerEntries.length > 0,
      contributionType,
      awardedUnits: res.reward.awardedUnits.map((u) => ({ unitType: u.unitType, amount: u.amount })),
      ledgerEntryIds: res.ledgerEntries.map((e) => e.id),
      subjectMode: res.reward.subjectMode,
      providerName: input.providerName,
      modelId: input.modelId,
      latencyMs: input.latencyMs,
      tokenEstimate: input.tokenEstimate,
      chainSummary,
      reason: res.reward.reason,
      notes: [...notes, ...res.reward.riskNotes],
    };
  } catch (e: any) {
    return {
      recorded: false,
      contributionType,
      awardedUnits: [],
      ledgerEntryIds: [],
      subjectMode,
      providerName: input.providerName,
      modelId: input.modelId,
      latencyMs: input.latencyMs,
      tokenEstimate: input.tokenEstimate,
      chainSummary,
      notes: [`数列货币写入失败：${e?.message ?? e}`],
    };
  }
}

export { estimateTokens };
