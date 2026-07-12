// 分层审计 · Chat Bridge
import {
  LAYER_AUDIT_CALCULUS,
  findLayersMissingAspect,
  findWeakestLayer,
  runLayerAudit,
} from "./layerAuditRuntime";
import type { LayerAspect, LayerGapReport } from "./layerAuditTypes";

export interface ChatLayerAuditInfo {
  calculusId: typeof LAYER_AUDIT_CALCULUS;
  question: string;
  summary: string;
  weakest?: {
    layerId: string;
    layerName: string;
    maturityScore: number;
  };
  focusAspect?: LayerAspect;
  aspectGaps?: { layerId: string; layerName: string; score: number; missing: string[] }[];
  report: LayerGapReport;
}

const TRIGGER_KEYWORDS = [
  "分层", "分层审计", "系统式补法", "整层补齐", "整体审计",
  "哪一层", "哪些层", "哪几层",
  "骨架", "肌肉", "血液", "神经",
  "L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10",
  "Aetherworld 现在最缺", "现在最缺什么", "下一轮整层补齐",
  "layer audit", "layered audit", "layer gap",
];

const ASPECT_PATTERNS: { aspect: LayerAspect; regex: RegExp }[] = [
  { aspect: "SKELETON", regex: /骨架|skeleton|registry|类型|状态机/i },
  { aspect: "MUSCLE",   regex: /肌肉|muscle|runtime|执行|executor|adapter/i },
  { aspect: "BLOOD",    regex: /血液|blood|record|memory|currency|msl|analytics|循环/i },
  { aspect: "NERVE",    regex: /神经|nerve|scheduler|notice|qa|review|verification|回路/i },
];

export function detectLayerAuditIntent(raw: string): boolean {
  if (!raw) return false;
  return TRIGGER_KEYWORDS.some((k) => new RegExp(k, "i").test(raw));
}

function pickAspect(raw: string): LayerAspect | undefined {
  for (const p of ASPECT_PATTERNS) {
    if (p.regex.test(raw)) return p.aspect;
  }
  return undefined;
}

export function buildChatLayerAuditInfo(raw: string): ChatLayerAuditInfo | undefined {
  if (!raw || !detectLayerAuditIntent(raw)) return undefined;
  const report = runLayerAudit();
  const weakestLayer = findWeakestLayer(report);
  const focusAspect = pickAspect(raw);
  const aspectGaps = focusAspect ? findLayersMissingAspect(report, focusAspect) : undefined;

  const parts: string[] = [report.summary];
  if (focusAspect && aspectGaps) {
    const cn = focusAspect === "SKELETON" ? "骨架"
      : focusAspect === "MUSCLE" ? "肌肉"
      : focusAspect === "BLOOD" ? "血液" : "神经";
    parts.push(`【${cn}】缺口层：${aspectGaps.map((g) => `${g.layerId}(${g.score})`).join("、") || "无"}`);
  }
  return {
    calculusId: LAYER_AUDIT_CALCULUS,
    question: raw,
    summary: parts.join(" "),
    weakest: weakestLayer && {
      layerId: weakestLayer.layerId,
      layerName: weakestLayer.layerName,
      maturityScore: weakestLayer.maturityScore,
    },
    focusAspect,
    aspectGaps,
    report,
  };
}

export { LAYER_AUDIT_CALCULUS };
