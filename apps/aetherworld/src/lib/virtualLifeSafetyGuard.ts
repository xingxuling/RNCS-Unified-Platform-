// 虚拟生活安全守护
import {
  VIRTUAL_LIFE_SAFETY_NOTE,
  VIRTUAL_LIFE_SAFETY_RULES,
  scanVirtualLifeText,
} from "@/constants/virtualLifeSafetyRules";

export interface SafetyCheckResult {
  safe: boolean;
  violations: string[];
  notice: string;
}

export function checkVirtualLifeOutput(text: string): SafetyCheckResult {
  const violations = scanVirtualLifeText(text);
  return {
    safe: violations.length === 0,
    violations,
    notice: VIRTUAL_LIFE_SAFETY_NOTE,
  };
}

export function getSafetyNote(): string {
  return VIRTUAL_LIFE_SAFETY_NOTE;
}

export function getSafetyRules() {
  return VIRTUAL_LIFE_SAFETY_RULES;
}
