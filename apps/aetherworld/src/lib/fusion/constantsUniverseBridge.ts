// 常数宇宙桥：聚合现有 ALLOWED_ENUMS + 引擎权重 + 五域常数，向 Prompt 输出"已应用常数组"清单。
import { ALLOWED_ENUMS } from "@/lib/chat/constantsPromptConstraintBridge";
import { FIVE_DOMAIN_CONSTANTS } from "@/constants/fusion/fiveDomainConstants";

export interface ConstantsAppliedReport {
  groups: string[];
  totalEnums: number;
}

export function applyConstantsUniverse(): ConstantsAppliedReport {
  const groups = [
    "RISK_LABEL",
    "QA_STATUS",
    "CHAT_OUTPUT_TYPE",
    "AUTHORITY_LEVEL",
    "SOCIAL_VISIBILITY",
    "FIVE_DOMAIN",
    "ENGINE_WEIGHT_PROFILE",
  ];
  const totalEnums =
    Object.values(ALLOWED_ENUMS).reduce((acc, v) => acc + v.length, 0) +
    FIVE_DOMAIN_CONSTANTS.length;
  return { groups, totalEnums };
}
