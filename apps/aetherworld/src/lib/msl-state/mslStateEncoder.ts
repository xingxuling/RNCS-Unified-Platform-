// MSL 状态编码 / 解码 v0.1
// 编码格式：
//   MSL::FRAME_TYPE
//   @status=...
//   @key=value
import type { MSLBuildAttrs, MSLStateFrame } from "./mslStateTypes";
import { newMslFrameId } from "./mslStateTypes";
import { sanitizeMslSegment, validateMslFields } from "./mslStateValidator";

function fiveToCode(five?: MSLBuildAttrs["fiveDomain"]): string | undefined {
  if (!five) return undefined;
  const parts: string[] = [];
  if (five.heaven) parts.push(`HEAVEN:${five.heaven}`);
  if (five.earth) parts.push(`EARTH:${five.earth}`);
  if (five.human) parts.push(`HUMAN:${five.human}`);
  if (five.spirit) parts.push(`SPIRIT:${five.spirit}`);
  if (five.wind) parts.push(`WIND:${five.wind}`);
  if (parts.length === 0) return undefined;
  return parts.join("|");
}

export function buildMslFrame(
  frameType: MSLStateFrame["frameType"],
  sourceModule: string,
  attrs: MSLBuildAttrs,
  ctx?: {
    chatSessionId?: string;
    messageId?: string;
    workspaceObjectId?: string;
  },
): MSLStateFrame {
  const lines: string[] = [`MSL::${frameType}`];
  const allNotes: string[] = [];
  let sanitizedFlag = false;

  const safetyStatus = attrs.safetyStatus ?? "PASS";

  // 主字段
  lines.push(`@status=${attrs.status}`);
  if (attrs.domain) lines.push(`@domain=${attrs.domain}`);
  if (attrs.calculusIds && attrs.calculusIds.length > 0) {
    lines.push(`@chain=${attrs.calculusIds.join(">")}`);
  }
  if (attrs.engineIds && attrs.engineIds.length > 0) {
    lines.push(`@engines=${attrs.engineIds.join(",")}`);
  }
  const fiveCode = fiveToCode(attrs.fiveDomain);
  if (fiveCode) {
    const { text, sensitive } = sanitizeMslSegment(fiveCode);
    if (sensitive) sanitizedFlag = true;
    lines.push(`@five=${text}`);
  }
  lines.push(`@safety=${safetyStatus}`);
  if (attrs.qaStatus) lines.push(`@qa=${attrs.qaStatus}`);
  if (attrs.valueEventId) lines.push(`@value=${attrs.valueEventId}`);
  if (attrs.memoryUnitId) lines.push(`@memory=${attrs.memoryUnitId}`);

  // 额外字段
  if (attrs.extra) {
    for (const [k, v] of Object.entries(attrs.extra)) {
      if (v === undefined || v === null || v === "") continue;
      const { text, sensitive } = sanitizeMslSegment(String(v));
      if (sensitive) sanitizedFlag = true;
      lines.push(`@${k}=${text}`);
    }
  }

  // 校验
  const v = validateMslFields(frameType, attrs.status, safetyStatus);
  if (!v.ok) allNotes.push(...v.notes);
  if (sanitizedFlag) allNotes.push("已对敏感字段执行脱敏。");

  // 校验失败：标记 WARN，但不阻断
  const finalSafety = sanitizedFlag && safetyStatus === "PASS" ? "WARN" : safetyStatus;

  return {
    id: newMslFrameId(),
    frameType,
    mslCode: lines.join("\n"),
    sourceModule,
    chatSessionId: ctx?.chatSessionId,
    messageId: ctx?.messageId,
    workspaceObjectId: ctx?.workspaceObjectId,
    domain: attrs.domain,
    calculusIds: attrs.calculusIds,
    engineIds: attrs.engineIds,
    fiveDomain: attrs.fiveDomain,
    status: v.ok ? attrs.status : "WARN",
    safetyStatus: finalSafety,
    qaStatus: attrs.qaStatus,
    valueEventId: attrs.valueEventId,
    memoryUnitId: attrs.memoryUnitId,
    validationNotes: allNotes,
    createdAt: new Date().toISOString(),
  };
}

/** 简单解码：仅按行解析 @k=v，仅用于调试 / Audit 显示 */
export function decodeMslCode(code: string): { frameType?: string; attrs: Record<string, string> } {
  const lines = code.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let frameType: string | undefined;
  const attrs: Record<string, string> = {};
  for (const line of lines) {
    if (line.startsWith("MSL::")) {
      frameType = line.slice(5);
    } else if (line.startsWith("@")) {
      const eq = line.indexOf("=");
      if (eq > 1) attrs[line.slice(1, eq)] = line.slice(eq + 1);
    }
  }
  return { frameType, attrs };
}
