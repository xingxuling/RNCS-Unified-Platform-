// MSL × Chat / Fusion / Tool / Memory / Currency 桥接层
// 仅基于已有结果生成 MSLStateFrame，绝不重复创建货币 / 记忆 / 工具系统。
import type { ChatMessage } from "@/lib/chat/chatMessageEngine";
import type { FusionRuntimeInfo } from "@/lib/fusion/fusionTypes";
import type { CalculusRoute } from "@/lib/chat/calculusRouteResultTypes";
import { buildMslFrame } from "./mslStateEncoder";
import { recordMslFrame } from "./mslStateStore";
import type { MSLStateFrame, MSLFrameStatus, MSLSafetyStatus, MSLFiveDomainSnapshot } from "./mslStateTypes";

/** Chat 结果卡折叠区显示用 */
export interface ChatMslInfo {
  frames: Array<{
    id: string;
    frameType: MSLStateFrame["frameType"];
    status: MSLFrameStatus;
    safetyStatus: MSLSafetyStatus;
    mslCode: string;
  }>;
  notes: string[];
}

function pickFiveDomain(fusion?: FusionRuntimeInfo): MSLFiveDomainSnapshot | undefined {
  if (!fusion) return undefined;
  const snap: MSLFiveDomainSnapshot = {};
  for (const c of fusion.fiveDomain.coordinates) {
    const tag = c.interpretation || c.label;
    // 仅写入主导域 + 高权重域，避免冗长
    if (c.weight >= 0.2 || c.domain === fusion.fiveDomain.dominantDomain) {
      const key = c.domain.toLowerCase() as keyof MSLFiveDomainSnapshot;
      (snap as any)[key] = tag;
    }
  }
  return Object.keys(snap).length > 0 ? snap : undefined;
}

export interface BuildChatMslArgs {
  chatSessionId: string;
  messageId: string;
  source: NonNullable<ChatMessage["source"]>;
  providerId?: string;
  modelId?: string;
  promptMode?: string;
  fusion?: FusionRuntimeInfo;
  calculusRoute?: CalculusRoute;
  outputType?: string;
  safetyStatus: MSLSafetyStatus;
  qaStatus?: string;
  memoryUnitId?: string;
  valueEventId?: string;
  memoryCompressionRatio?: number;
}

/**
 * 为一轮 Chat 生成 MSL 帧组：CHAT_TURN（必）+ FUSION_PLAN（若有融合）
 * + SEQUENCE_MEMORY / SEQUENCE_CURRENCY 引用帧（若存在）
 */
export function buildChatMslFrames(args: BuildChatMslArgs): ChatMslInfo {
  const frames: MSLStateFrame[] = [];
  const ctx = { chatSessionId: args.chatSessionId, messageId: args.messageId };

  const baseStatus: MSLFrameStatus =
    args.source === "FALLBACK" ? "FALLBACK" :
    args.safetyStatus === "BLOCK" ? "BLOCKED" :
    args.safetyStatus === "WARN" ? "WARN" : "SUCCESS";

  // 1. CHAT_TURN
  const chatFrame = buildMslFrame("CHAT_TURN", "chat", {
    status: baseStatus,
    safetyStatus: args.safetyStatus,
    qaStatus: args.qaStatus,
    domain: args.fusion?.engineProfile.intentType ?? "CHAT_GENERAL",
    extra: {
      source: args.source,
      model: args.modelId && args.providerId ? `${args.providerId}/${args.modelId}` : args.providerId,
      promptMode: args.promptMode,
      output: args.outputType,
    },
  }, ctx);
  frames.push(recordMslFrame(chatFrame));

  // 2. FUSION_PLAN
  if (args.fusion) {
    const chain = args.fusion.chain.steps.map((s) => s.calculusId);
    const engines = args.fusion.engineProfile.activeEngines.slice(0, 4).map(
      (w) => `${w.engineId}:${w.weight.toFixed(2)}`,
    );
    const driftSeverity = args.fusion.drift?.severity ?? "NONE";
    const fusionStatus: MSLFrameStatus =
      driftSeverity === "SEVERE" ? "WARN" :
      driftSeverity === "MINOR" ? "WARN" :
      baseStatus === "BLOCKED" ? "BLOCKED" : "SUCCESS";
    const fusionFrame = buildMslFrame("FUSION_PLAN", "fusion", {
      status: fusionStatus,
      safetyStatus: args.safetyStatus,
      qaStatus: args.qaStatus ?? "NOT_CHECKED",
      domain: args.fusion.engineProfile.intentType,
      calculusIds: chain,
      engineIds: engines,
      fiveDomain: pickFiveDomain(args.fusion),
      extra: {
        chainReason: args.fusion.chain.reason,
        concepts: args.fusion.conceptGraph?.nodes.slice(0, 5).map((n) => n.label).join("·"),
        drift: driftSeverity,
      },
    }, ctx);
    frames.push(recordMslFrame(fusionFrame));
  }

  // 3. SEQUENCE_MEMORY 引用
  if (args.memoryUnitId) {
    const memFrame = buildMslFrame("SEQUENCE_MEMORY", "sequence-memory", {
      status: "SUCCESS",
      safetyStatus: args.safetyStatus,
      memoryUnitId: args.memoryUnitId,
      extra: {
        compressionRatio: typeof args.memoryCompressionRatio === "number"
          ? args.memoryCompressionRatio.toFixed(2) : undefined,
      },
    }, ctx);
    frames.push(recordMslFrame(memFrame));
  }

  // 4. SEQUENCE_CURRENCY 引用
  if (args.valueEventId) {
    const curFrame = buildMslFrame("SEQUENCE_CURRENCY", "sequence-currency", {
      status: "SUCCESS",
      safetyStatus: args.safetyStatus,
      valueEventId: args.valueEventId,
      extra: { eventType: "MODEL_CALL" },
    }, ctx);
    frames.push(recordMslFrame(curFrame));
  }

  return {
    frames: frames.map((f) => ({
      id: f.id,
      frameType: f.frameType,
      status: f.status,
      safetyStatus: f.safetyStatus,
      mslCode: f.mslCode,
    })),
    notes: frames.flatMap((f) => f.validationNotes ?? []),
  };
}

/** 工具调用帧：成功 / 阻断 / 待确认 */
export interface BuildToolMslArgs {
  chatSessionId?: string;
  messageId?: string;
  toolId: string;
  status: MSLFrameStatus;
  reason?: string;
  safetyStatus?: MSLSafetyStatus;
  qaStatus?: string;
}

export function buildToolMslFrame(args: BuildToolMslArgs): MSLStateFrame {
  const frame = buildMslFrame("TOOL_CALL", "tool-runtime", {
    status: args.status,
    safetyStatus: args.safetyStatus ?? (args.status === "BLOCKED" ? "BLOCK" : "PASS"),
    qaStatus: args.qaStatus,
    extra: { tool: args.toolId, reason: args.reason },
  }, { chatSessionId: args.chatSessionId, messageId: args.messageId });
  return recordMslFrame(frame);
}
