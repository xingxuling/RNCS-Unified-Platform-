// 黑箱信号提取
import type { OutputAudienceId } from "@/constants/compression/outputAudienceTypes";

export interface BlackBoxSignal {
  signalName: string;
  signalStrength: number;  // 0-1
  confidence: number;      // 0-1
  sourceEngines: string[];
  patternSummary: string;
  uncertainty: string;
  shouldExposeToUser: boolean;
}

export interface RawEngineOutput {
  engine: string;
  intent?: string;
  conclusion?: string;
  signals?: { name: string; strength?: number; confidence?: number; note?: string }[];
  trace?: string[];
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence?: string[];
  knowledgeRefs?: string[];
  [k: string]: unknown;
}

export function extractBlackBoxSignals(
  raws: RawEngineOutput[],
  audience: OutputAudienceId,
): BlackBoxSignal[] {
  const out: BlackBoxSignal[] = [];
  for (const r of raws) {
    for (const s of r.signals ?? []) {
      const strength = clamp(s.strength ?? 0.6);
      const conf = clamp(s.confidence ?? 0.5);
      out.push({
        signalName: s.name,
        signalStrength: strength,
        confidence: conf,
        sourceEngines: [r.engine],
        patternSummary: s.note ?? `${r.engine} 检测到模式：${s.name}`,
        uncertainty: conf < 0.6 ? "中等不确定" : "较低不确定",
        shouldExposeToUser: audience !== "PLAIN_USER" && strength >= 0.5,
      });
    }
  }
  // 合并同名信号
  const merged = new Map<string, BlackBoxSignal>();
  for (const s of out) {
    const cur = merged.get(s.signalName);
    if (!cur) merged.set(s.signalName, s);
    else {
      cur.sourceEngines = Array.from(new Set([...cur.sourceEngines, ...s.sourceEngines]));
      cur.signalStrength = Math.max(cur.signalStrength, s.signalStrength);
      cur.confidence = Math.max(cur.confidence, s.confidence);
    }
  }
  return Array.from(merged.values()).sort((a, b) => b.signalStrength - a.signalStrength);
}

function clamp(n: number) { return Math.max(0, Math.min(1, n)); }
