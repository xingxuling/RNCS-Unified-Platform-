// 白箱结构提取
import type { RawEngineOutput } from "./blackBoxSignalExtractor";

export interface WhiteBoxStructure {
  objectDefinition: string;
  keyVariables: string[];
  evidencePoints: string[];
  engineTrace: string[];
  knowledgeSources: string[];
  riskFactors: string[];
  validationPoints: string[];
}

export function extractWhiteBoxStructure(raws: RawEngineOutput[]): WhiteBoxStructure {
  const conc = raws.map(r => r.conclusion).filter(Boolean) as string[];
  const evidence = uniq(raws.flatMap(r => r.evidence ?? []));
  const trace = uniq(raws.flatMap(r => r.trace ?? [r.engine]));
  const knowledge = uniq(raws.flatMap(r => r.knowledgeRefs ?? []));
  const risk = uniq(raws.filter(r => r.riskLevel && r.riskLevel !== "LOW").map(r => `${r.engine}: ${r.riskLevel}`));
  return {
    objectDefinition: conc[0] ?? "系统综合判断对象",
    keyVariables: uniq(raws.map(r => r.intent ?? r.engine)),
    evidencePoints: evidence.slice(0, 8),
    engineTrace: trace.slice(0, 12),
    knowledgeSources: knowledge.slice(0, 8),
    riskFactors: risk,
    validationPoints: deriveValidation(raws),
  };
}

function deriveValidation(raws: RawEngineOutput[]): string[] {
  const v: string[] = [];
  for (const r of raws) {
    if (r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL") v.push(`对 ${r.engine} 输出执行人工复核。`);
  }
  if (!v.length) v.push("观察 24 小时内是否复现同一信号。");
  return v.slice(0, 5);
}

function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)); }
