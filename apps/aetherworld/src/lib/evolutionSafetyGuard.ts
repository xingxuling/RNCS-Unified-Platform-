// 进化安全守护 Evolution Safety Guard
import type { EvolutionMutation } from "@/constants/evolutionMutationTypes";
import { EVOLUTION_SAFETY_RULES } from "@/constants/evolutionSafetyRules";

export interface SafetyCheckResult {
  passed: boolean;
  warnings: string[];
  blockedReasons: string[];
}

export interface SafetyContext {
  isFounder: boolean;
  hasConfirmation: boolean;
}

export function checkMutationSafety(m: EvolutionMutation, ctx: SafetyContext): SafetyCheckResult {
  const warnings: string[] = [];
  const blocked: string[] = [];

  if (m.riskLevel === "HIGH" && !ctx.isFounder) {
    blocked.push("[HIGH] 此操作为高风险，仅创始人模式可执行。");
  }
  if (m.requiresConfirmation && !ctx.hasConfirmation) {
    warnings.push("[MEDIUM] 此 mutation 需要用户二次确认。");
  }
  if (m.type === "FOUNDER_SHORTCUT_ENABLE" && !ctx.isFounder) {
    blocked.push("[CRITICAL] 非创始人不可启用创始人快捷入口。");
  }
  // Heuristic: profile updates touching core constants are forbidden auto
  const after = JSON.stringify(m.afterState ?? {}).toLowerCase();
  if (after.includes("constant") && after.includes("override")) {
    blocked.push("[CRITICAL] 不可自动覆盖核心常数。");
  }

  return {
    passed: blocked.length === 0,
    warnings,
    blockedReasons: blocked,
  };
}

export function listSafetyRules() { return EVOLUTION_SAFETY_RULES; }
