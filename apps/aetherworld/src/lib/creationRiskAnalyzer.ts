// 现实约束识别（heuristic）
import { CREATION_RISK_TYPES, type CreationRiskType, CREATION_REALITY_BOUNDARY_TEXT } from "@/constants/creationRiskTypes";
import type { CreationInput } from "./creationSeedCompiler";

const HIGH_REALITY_KEYS = [
  "硬件", "量产", "MR", "VR", "机器人", "医疗", "药", "诊断", "金融", "投资",
  "建筑", "工程", "电池", "化学", "无人机", "汽车", "支付",
];

export interface IdentifiedRisk extends CreationRiskType {
  hitBy: string[];
}

export function identifyRisks(input: CreationInput): IdentifiedRisk[] {
  const text = [input.name, input.description, input.targetEnvironment, input.desiredFunction, ...(input.constraints ?? [])].join(" ");
  const hits: IdentifiedRisk[] = [];
  for (const r of CREATION_RISK_TYPES) {
    const reasons: string[] = [];
    if (r.id === "REALITY_RISK" && HIGH_REALITY_KEYS.some(k => text.includes(k))) reasons.push("涉及高风险领域");
    if (r.id === "COMPLEXITY_OVERLOAD" && text.length > 280) reasons.push("描述复杂度高");
    if (r.id === "COST_PRESSURE" && /量产|低成本|大规模/.test(text)) reasons.push("成本/规模相关");
    if (r.id === "MATERIAL_CONSTRAINT" && /硬件|材料|铝合金|塑料|镀层/.test(text)) reasons.push("涉及物理材料");
    if (r.id === "ENERGY_CONSTRAINT" && /电池|散热|发热|功耗/.test(text)) reasons.push("能耗/散热相关");
    if (r.id === "USER_MISFIT" && !input.targetUser) reasons.push("未指定目标用户");
    if (r.id === "ENVIRONMENTAL_RESISTANCE" && !input.targetEnvironment) reasons.push("未指定目标场域");
    if (r.id === "AESTHETIC_FAILURE" && /(玄|神|宿命|术语){3,}/.test(text)) reasons.push("术语/神化密度高");
    if (r.id === "ADOPTION_FAILURE" && (input.targetUser?.length ?? 0) < 4) reasons.push("用户画像不清");
    if (r.id === "MISREAD_AS_REAL_SIM" && /(仿真|模拟|绝对)/.test(text)) reasons.push("可能被误读为真实仿真");
    if (reasons.length) hits.push({ ...r, hitBy: reasons });
  }
  return hits;
}

export function getRealityBoundaryText(): string {
  return CREATION_REALITY_BOUNDARY_TEXT;
}
