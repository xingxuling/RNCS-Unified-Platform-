// 调用链压缩
import type { RawEngineOutput } from "./blackBoxSignalExtractor";
import type { OutputAudienceId } from "@/constants/compression/outputAudienceTypes";

export interface CompressedTrace {
  primaryEngine: string;
  supportingEngines: string[];
  validationEngines: string[];
  blockedEngines: string[];
  routeReason: string;
  traceSummary: string;
}

const VALIDATION_HINT = /qa|validation|recalc|audit|check/i;
const BLOCKED_HINT = /blocked|denied|skipped/i;

export function compressTrace(raws: RawEngineOutput[], audience: OutputAudienceId): CompressedTrace {
  const engines = raws.map(r => r.engine);
  const primary = engines[0] ?? "Sequence AI";
  const supporting = engines.slice(1).filter(e => !VALIDATION_HINT.test(e) && !BLOCKED_HINT.test(e));
  const validation = engines.filter(e => VALIDATION_HINT.test(e));
  const blocked = engines.filter(e => BLOCKED_HINT.test(e));
  const reason = `根据目标 ${raws[0]?.intent ?? "综合判断"} 路由到 ${primary}。`;
  const summary = audience === "PLAIN_USER"
    ? "系统已综合多个内部引擎完成判断。"
    : audience === "STRUCTURED_USER"
      ? `主引擎 ${primary}，协同 ${supporting.slice(0, 3).join(" / ") || "无"}。`
      : `Trace: ${engines.join(" → ")}`;
  return {
    primaryEngine: primary,
    supportingEngines: Array.from(new Set(supporting)),
    validationEngines: Array.from(new Set(validation)),
    blockedEngines: Array.from(new Set(blocked)),
    routeReason: reason,
    traceSummary: summary,
  };
}
