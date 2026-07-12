// Constant Universe v0.2 — Constant Registry (统一注册表)
import { DIGIT_CONSTANTS } from "@/constants/constant-universe/digitConstants";
import { DOMAIN_CONSTANTS } from "@/constants/constant-universe/domainConstants";
import { ENGINE_WEIGHT_CONSTANTS } from "@/constants/constant-universe/engineConstants";
import { THRESHOLD_CONSTANTS } from "@/constants/constant-universe/thresholdConstants";
import { RISK_CONSTANTS } from "@/constants/constant-universe/riskConstants";
import { WORLD_SIMULATION_CONSTANTS } from "@/constants/constant-universe/worldSimulationConstants";
import { WORLD_GROWTH_CONSTANTS } from "@/constants/constant-universe/worldGrowthConstants";
import { WORLD_SOCIETY_CONSTANTS } from "@/constants/constant-universe/worldSocietyConstants";
import { CIVILIZATION_CONSTANTS } from "@/constants/constant-universe/civilizationConstants";
import { PRESENTATION_CONSTANTS } from "@/constants/constant-universe/presentationConstants";
import { COMPRESSION_CONSTANTS } from "@/constants/constant-universe/compressionConstants";
import { VALIDATION_CONSTANTS } from "@/constants/constant-universe/validationConstants";
import { MODE_CONSTANTS } from "@/constants/constant-universe/modeConstants";
import { CONSTANT_SAFETY_RULES, CURRENCY_NON_FINANCIAL_LOCKS } from "@/constants/constant-universe/constantSafetyRules";

export type ConstantCategory =
  | "DIGIT_CONSTANT" | "DOMAIN_CONSTANT" | "ENGINE_WEIGHT" | "THRESHOLD" | "RISK_BOUNDARY"
  | "WORLD_SIMULATION" | "WORLD_GROWTH" | "WORLD_SOCIETY" | "CIVILIZATION"
  | "PRESENTATION" | "COMPRESSION" | "VALIDATION" | "SUBJECT_MODE" | "SAFETY";

export type AccessLevel = "PUBLIC" | "ADVANCED" | "FOUNDER_ONLY" | "SYSTEM_ONLY";
export type StabilityLevel = "STATIC" | "VERSIONED" | "EXPERIMENTAL" | "DEPRECATED";

export interface ConstantDefinition {
  id: string;
  name: string;
  category: ConstantCategory;
  value: unknown;
  description: string;
  usedByEngines: string[];
  accessLevel: AccessLevel;
  stabilityLevel: StabilityLevel;
  founderLocked: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export const CONSTANT_UNIVERSE_VERSION = "0.2.0";
const NOW = "2026-05-24T00:00:00Z";

function def(
  id: string, name: string, category: ConstantCategory, value: unknown,
  description: string, usedByEngines: string[],
  accessLevel: AccessLevel = "PUBLIC", founderLocked = false,
  stabilityLevel: StabilityLevel = "VERSIONED"
): ConstantDefinition {
  return {
    id, name, category, value, description, usedByEngines,
    accessLevel, stabilityLevel, founderLocked,
    version: CONSTANT_UNIVERSE_VERSION, createdAt: NOW, updatedAt: NOW,
  };
}

export const CONSTANT_REGISTRY: ConstantDefinition[] = [
  ...DIGIT_CONSTANTS.map((d) =>
    def(`DIGIT_${d.digit}`, `数字常数 ${d.digit} · ${d.chineseName}`, "DIGIT_CONSTANT", d,
      `数字 ${d.digit} = ${d.opcode} · ${d.coreMeaning.join("/")}`,
      ["MSL", "SequenceAI", "WorldEngine", "Narrative", "Vocal", "Currency", "Compression"],
      "PUBLIC", true, "STATIC")
  ),
  ...DOMAIN_CONSTANTS.map((d) =>
    def(`DOMAIN_${d.domainId}`, `五域常数 · ${d.chineseName}`, "DOMAIN_CONSTANT", d,
      `位置 ${d.position} · ${d.meaning.join("/")}`, d.affectedEngines,
      "PUBLIC", true, "STATIC")
  ),
  ...ENGINE_WEIGHT_CONSTANTS.map((e) =>
    def(`ENGINE_WEIGHT_${e.intent}`, `引擎权重 · ${e.chineseName}`, "ENGINE_WEIGHT", e,
      `意图 ${e.intent} 的引擎权重`, ["SequenceAI", "Omni", "Recalculation"],
      "ADVANCED", false, "VERSIONED")
  ),
  ...THRESHOLD_CONSTANTS.map((t) =>
    def(t.id, t.name, "THRESHOLD", t.value, t.description, t.usedByEngines,
      "ADVANCED", t.id === "FULL60_PRIVACY_REQUIRED" || t.id === "DEMO_REAL_MIXING_BLOCK", "VERSIONED")
  ),
  ...RISK_CONSTANTS.map((r) =>
    def(`RISK_${r.riskId}`, `风险常数 · ${r.chineseName}`, "RISK_BOUNDARY", r,
      `默认严重度 ${r.severityDefault}`, ["Safety", "SoftwareQA", "Compression"],
      "ADVANCED", true, "VERSIONED")
  ),
  ...Object.entries(WORLD_SIMULATION_CONSTANTS).map(([k, v]) =>
    def(`WS_${k}`, `世界模拟 · ${k}`, "WORLD_SIMULATION", v, `世界模拟常数 ${k}`,
      ["WorldEngine"], "ADVANCED", false, "VERSIONED")
  ),
  ...Object.entries(WORLD_GROWTH_CONSTANTS).map(([k, v]) =>
    def(`WG_${k}`, `世界生长 · ${k}`, "WORLD_GROWTH", v, `世界生长常数 ${k}`,
      ["WorldGrowth"], "ADVANCED", k === "FOUNDER_LOCKED_IMMUTABLE", "VERSIONED")
  ),
  ...Object.entries(WORLD_SOCIETY_CONSTANTS).map(([k, v]) =>
    def(`WSOC_${k}`, `世界社会 · ${k}`, "WORLD_SOCIETY", v, `世界社会常数 ${k}`,
      ["WorldSociety"], "ADVANCED", false, "VERSIONED")
  ),
  ...Object.entries(CIVILIZATION_CONSTANTS).map(([k, v]) =>
    def(`CIV_${k}`, `文明 · ${k}`, "CIVILIZATION", v, `文明演化常数 ${k}`,
      ["Civilization"], "ADVANCED", false, "VERSIONED")
  ),
  ...Object.entries(PRESENTATION_CONSTANTS).map(([k, v]) =>
    def(`PRES_${k}`, `表现层 · ${k}`, "PRESENTATION", v, `表现层常数 ${k}`,
      ["Presentation"], "ADVANCED", k === "SEMANTIC_PHYSICS_NOT_REAL_PHYSICS", "VERSIONED")
  ),
  ...Object.entries(COMPRESSION_CONSTANTS).map(([k, v]) =>
    def(`COMP_${k}`, `压缩 · ${k}`, "COMPRESSION", v, `压缩输出常数 ${k}`,
      ["Compression"], "ADVANCED", false, "VERSIONED")
  ),
  ...VALIDATION_CONSTANTS.map((v) =>
    def(`VAL_${v.validationType}`, `回验 · ${v.chineseName}`, "VALIDATION", v,
      `回验信号 ${v.measurableSignals.join("/")}`, ["Validation", "Recalculation"],
      "ADVANCED", false, "VERSIONED")
  ),
  ...Object.values(MODE_CONSTANTS).map((m) =>
    def(`MODE_${m.modeId}`, `主体模式 · ${m.chineseName}`, "SUBJECT_MODE", m,
      `${m.chineseName} 模式常数`, ["SubjectMode", "SequenceAI", "Omni"],
      m.modeId === "FOUNDER" ? "FOUNDER_ONLY" : "PUBLIC",
      true, "STATIC")
  ),
  ...CONSTANT_SAFETY_RULES.map((s) =>
    def(`SAFETY_${s.ruleId}`, `安全规则 · ${s.ruleId}`, "SAFETY", s,
      s.description, ["Safety", "SubjectMode", "Currency"],
      "SYSTEM_ONLY", true, "STATIC")
  ),
  def("CURRENCY_NON_FINANCIAL_LOCKS", "数列货币非金融锁定", "SAFETY", CURRENCY_NON_FINANCIAL_LOCKS,
    "数列货币：内部使用、不可兑现、不可转移、非投资资产", ["SequenceCurrency"],
    "SYSTEM_ONLY", true, "STATIC"),
];

export function getConstant(id: string): ConstantDefinition | undefined {
  return CONSTANT_REGISTRY.find((c) => c.id === id);
}

export function listByCategory(category: ConstantCategory): ConstantDefinition[] {
  return CONSTANT_REGISTRY.filter((c) => c.category === category);
}

export function searchConstants(q: string): ConstantDefinition[] {
  const s = q.toLowerCase();
  return CONSTANT_REGISTRY.filter(
    (c) => c.id.toLowerCase().includes(s) || c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)
  );
}

export function countByCategory(): Record<ConstantCategory, number> {
  const out = {} as Record<ConstantCategory, number>;
  for (const c of CONSTANT_REGISTRY) out[c.category] = (out[c.category] ?? 0) + 1;
  return out;
}
