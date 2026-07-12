import type { ExternalDataSource } from "./externalDataSourceRegistry";
import { listExternalDataSources } from "./externalDataSourceRegistry";
import type { NoiseRiskType } from "@/constants/reality-data/noiseRiskTypes";
import { NOISE_RISK_TYPES } from "@/constants/reality-data/noiseRiskTypes";

export interface NoiseRisk {
  sourceId: string;
  noiseLevel: "LOW" | "MEDIUM" | "HIGH";
  noiseTypes: NoiseRiskType[];
  mitigation: string[];
}

export function detectNoise(source: ExternalDataSource): NoiseRisk {
  const types: NoiseRiskType[] = [];
  if (source.sourceType === "DEMO_DATA") types.push("DEMO_DATA_NOISE");
  if (source.sourceType === "USER_PROVIDED") types.push("USER_INPUT_AMBIGUITY");
  if (source.sourceType === "MARKET_DATA") types.push("SHORT_TERM_VOLATILITY");
  if (source.sourceType === "PUBLIC_WEB") types.push("METHODOLOGY_OPAQUE");
  if (!source.dataDate) types.push("OUTDATED_CONTEXT");
  const level = types.length >= 3 ? "HIGH" : types.length >= 1 ? "MEDIUM" : "LOW";
  const mitigation = types.map((t) => NOISE_RISK_TYPES.find((x) => x.id === t)?.mitigation ?? "").filter(Boolean);
  return { sourceId: source.sourceId, noiseLevel: level, noiseTypes: types, mitigation };
}

export function detectAllNoise(): NoiseRisk[] {
  return listExternalDataSources().map(detectNoise);
}
