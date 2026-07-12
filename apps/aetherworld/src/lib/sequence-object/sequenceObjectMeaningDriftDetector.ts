// sequenceObjectMeaningDriftDetector.ts
import type { SequenceObjectType } from "@/constants/sequence-object/sequenceObjectTypes";
import type { SequenceObjectRiskType } from "@/constants/sequence-object/sequenceObjectRiskTypes";
import { RISK_SEVERITY } from "@/constants/sequence-object/sequenceObjectRiskTypes";

export interface MeaningDriftFinding {
  risk: SequenceObjectRiskType;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  message: string;
}

export interface MeaningDriftCheck {
  level: "PASS" | "WARN" | "BLOCK";
  findings: MeaningDriftFinding[];
}

const CHECKS: Array<{ pattern: RegExp; risk: SequenceObjectRiskType; message: string; types?: SequenceObjectType[] }> = [
  { pattern: /(现实|事实|真相|真实)/, risk: "REAL_FACT_CLAIM", message: "对象被解释为现实绝对事实。" },
  { pattern: /(已验证|科学定律|peer.?review)/i, risk: "SCIENCE_VERIFIED_CLAIM", message: "模型被解释为已验证科学。", types: ["MODEL_OBJECT"] },
  { pattern: /(已部署|生产环境|production)/i, risk: "PRODUCTION_DEPLOYED_CLAIM", message: "系统对象被解释为已生产部署。" },
  { pattern: /(真实后端|真实 ?AI|backend api)/i, risk: "REAL_BACKEND_CLAIM", message: "引擎对象被解释为实际 AI 后端。", types: ["ENGINE_OBJECT"] },
  { pattern: /(现实法律|legal binding)/i, risk: "REAL_LAW_CLAIM", message: "文明对象被解释为现实法律。" },
  { pattern: /(物理定律|natural law|宇宙定律)/i, risk: "REAL_PHYSICS_CLAIM", message: "常数宇宙被解释为自然物理定律。" },
  { pattern: /(金融资产|可投资|tradable|证券)/i, risk: "FINANCIAL_ASSET_CLAIM", message: "数列货币对象被解释为现实金融资产。" },
  { pattern: /(必然发生|绝对预测|will happen)/i, risk: "REALITY_FORECAST_CLAIM", message: "虚拟世界对象被解释为现实预测。" },
];

export function detectObjectMeaningDrift(text: string, type: SequenceObjectType): MeaningDriftCheck {
  const findings: MeaningDriftFinding[] = [];
  for (const c of CHECKS) {
    if (c.types && !c.types.includes(type)) continue;
    if (c.pattern.test(text)) {
      findings.push({ risk: c.risk, severity: RISK_SEVERITY[c.risk], message: c.message });
    }
  }
  const hasCritical = findings.some((f) => f.severity === "CRITICAL");
  return { level: hasCritical ? "BLOCK" : findings.length ? "WARN" : "PASS", findings };
}
