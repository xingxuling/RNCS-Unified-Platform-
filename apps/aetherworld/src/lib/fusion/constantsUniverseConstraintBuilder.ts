// 常数宇宙约束 Prompt 构建：在已有 buildConstantsConstraintPrompt 基础上，
// 再加入五域常数与引擎权重的"硬列表"，用于显著降低概念漂移。
import { FIVE_DOMAIN_CONSTANTS } from "@/constants/fusion/fiveDomainConstants";
import { ENGINE_WEIGHT_PROFILES } from "@/constants/engine/engineWeightConstants";

export function buildFusionConstantsConstraintPrompt(): string {
  const lines: string[] = [];
  lines.push("【融合常数约束】");
  lines.push(
    `五域 FIVE_DOMAIN：${FIVE_DOMAIN_CONSTANTS.map((d) => `${d.id}(${d.label})`).join(" / ")}`,
  );
  lines.push(
    `引擎权重 ENGINE_WEIGHT_PROFILE：${ENGINE_WEIGHT_PROFILES.map((p) => p.intentType).join(" / ")}`,
  );
  lines.push("禁止发明未列出的五域名称或意图类型。");
  return lines.join("\n");
}
