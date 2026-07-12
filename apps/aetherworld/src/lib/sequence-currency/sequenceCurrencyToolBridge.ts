// Tool Calling → 数列货币系统计量桥。
// 执行 / 阻断 / 待确认都记录，阻断同时视为安全治理事件。
import { recordContribution } from "@/lib/currency/sequenceCurrencyEngine";
import { isFounderActive } from "@/lib/founderCalculus";
import type { ContributionTypeId } from "@/constants/currency/contributionTypes";

export interface ToolCallCurrencyInput {
  toolId: string;
  status: "EXECUTED" | "BLOCKED" | "PENDING_CONFIRM" | "SIMULATED";
  permissionStatus?: string;
  safetyStatus?: "PASS" | "WARN" | "BLOCK";
  generatedObjectId?: string;
  chatMessageId?: string;
}

function mapToolContribution(toolId: string, blocked: boolean): ContributionTypeId {
  if (blocked) return "RUN_QA"; // 阻断视为治理性事件
  if (toolId.startsWith("workspace.")) return "EXPORT_ASSET";
  if (toolId.startsWith("calendar.")) return "COMPLETE_VIRTUAL_LIFE_TASK";
  if (toolId.startsWith("codeSandbox.")) return "RUN_QA";
  if (toolId.startsWith("appRuntime.")) return "CREATE_PROMPT";
  if (toolId.startsWith("store.")) return "EXPORT_ASSET";
  if (toolId.startsWith("social.")) return "PROVIDE_FEEDBACK";
  return "EXPORT_ASSET";
}

export function recordToolCallCurrencyEvent(input: ToolCallCurrencyInput) {
  const userMode = isFounderActive() ? "FOUNDER" : "LIGHT_20";
  const blocked = input.status === "BLOCKED" || input.safetyStatus === "BLOCK";
  const contributionType = mapToolContribution(input.toolId, blocked);
  const safetyScore = blocked ? 3 : input.safetyStatus === "WARN" ? 5 : 8;
  try {
    return recordContribution({
      contributionType,
      userMode,
      qualityScore: blocked ? 3 : 5,
      usefulnessScore: blocked ? 2 : 5,
      validationScore: 4,
      complexityScore: 3,
      safetyScore,
      duplicationRisk: 0,
      description: `工具调用：${input.toolId} · 状态 ${input.status}${
        input.generatedObjectId ? " · 对象 " + input.generatedObjectId : ""
      }`,
      sourceEngine: "ChatToolRuntime",
      sourceId: input.chatMessageId ?? input.toolId,
    });
  } catch {
    return undefined;
  }
}
