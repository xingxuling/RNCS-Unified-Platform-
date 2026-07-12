// UI Safety Guard
import { UI_SAFETY_RULES, UI_SAFETY_FOOTER, type UISafetyRule } from "@/constants/ui-update/uiSafetyRules";

export { UI_SAFETY_RULES, UI_SAFETY_FOOTER };
export type { UISafetyRule };

export interface UISafetyDecision {
  allowed: boolean;
  blockedBy?: string;
  warnings: string[];
}

export function evaluateUISafety(input: { audience: "PUBLIC" | "ADVANCED" | "FOUNDER"; action: string; }): UISafetyDecision {
  const warnings: string[] = [];
  if (input.audience === "PUBLIC" && /constitution\.amend|constant\.lock|founder\./i.test(input.action)) {
    return { allowed: false, blockedBy: "UI-S-008", warnings: ["普通用户不可执行 Founder Locked 动作"] };
  }
  if (input.audience !== "FOUNDER" && /founder-terminal/i.test(input.action)) {
    return { allowed: false, blockedBy: "UI-S-004", warnings: ["Founder Terminal 受权限保护"] };
  }
  if (/withdraw|提现|法币|套现/i.test(input.action)) {
    return { allowed: false, blockedBy: "UI-S-006", warnings: ["数列货币不可金融化"] };
  }
  return { allowed: true, warnings };
}
