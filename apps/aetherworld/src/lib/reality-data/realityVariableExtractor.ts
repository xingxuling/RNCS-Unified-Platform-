import type { DataCredibilityLevel } from "@/constants/reality-data/dataCredibilityLevels";
import type { DataFreshnessLevel } from "@/constants/reality-data/dataFreshnessLevels";

export type RealityVariableType =
  | "MACRO" | "POLICY" | "MARKET" | "RANKING" | "ORGANIZATION"
  | "TECHNOLOGY" | "USER_BEHAVIOR" | "PRODUCT_METRIC" | "VALIDATION_SIGNAL"
  | "RISK_SIGNAL" | "GEO" | "TIME" | "PRICE" | "SENTIMENT";

export interface RealityVariable {
  variableId: string;
  name: string;
  variableType: RealityVariableType;
  value: string | number | Record<string, unknown>;
  sourceId: string;
  evidenceType: string;
  freshnessLevel: DataFreshnessLevel;
  credibilityLevel: DataCredibilityLevel;
  timeWindow?: string;
  uncertainty: string;
  relatedQuestion?: string;
}

export interface ExtractInput {
  sourceId: string;
  content: string;
  freshnessLevel: DataFreshnessLevel;
  credibilityLevel: DataCredibilityLevel;
  relatedQuestion?: string;
}

export function extractRealityVariables(input: ExtractInput): RealityVariable[] {
  const out: RealityVariable[] = [];
  const make = (type: RealityVariableType, name: string, value: string | number) => ({
    variableId: `var_${Date.now().toString(36)}_${out.length}`,
    name, variableType: type, value,
    sourceId: input.sourceId,
    evidenceType: "EXTRACTED",
    freshnessLevel: input.freshnessLevel,
    credibilityLevel: input.credibilityLevel,
    uncertainty: input.credibilityLevel === "OFFICIAL" ? "LOW" : "MEDIUM",
    relatedQuestion: input.relatedQuestion,
  } as RealityVariable);
  const text = input.content;
  const yearMatch = text.match(/(20\d{2})/);
  if (yearMatch) out.push(make("TIME", "year", yearMatch[1]));
  if (/排名|ranking/i.test(text)) {
    const numMatch = text.match(/第\s*(\d+)\s*[名位]|#\s*(\d+)|rank\s*(\d+)/i);
    out.push(make("RANKING", "ranking", numMatch ? Number(numMatch[1] ?? numMatch[2] ?? numMatch[3]) : "unspecified"));
  }
  const priceMatch = text.match(/([￥$])\s*([\d,]+(?:\.\d+)?)/);
  if (priceMatch) out.push(make("PRICE", "price", priceMatch[0]));
  if (/政策|policy/i.test(text)) out.push(make("POLICY", "policy_signal", text.slice(0, 80)));
  if (/市场|market/i.test(text)) out.push(make("MARKET", "market_signal", text.slice(0, 80)));
  if (/香港|北京|上海|深圳|广州|hong kong/i.test(text)) {
    const geo = text.match(/香港|北京|上海|深圳|广州|hong kong/i);
    out.push(make("GEO", "geo", geo ? geo[0] : "unknown"));
  }
  if (out.length === 0) out.push(make("MACRO", "summary", text.slice(0, 120)));
  return out;
}
