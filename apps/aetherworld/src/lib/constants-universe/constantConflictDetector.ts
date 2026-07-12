// Constant Universe v0.2 — Conflict Detector
import { CONSTANT_REGISTRY, listByCategory, type ConstantDefinition } from "./constantRegistry";
import { DIGIT_CONSTANTS } from "@/constants/constant-universe/digitConstants";

export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ConstantConflict {
  conflictId: string;
  severity: ConflictSeverity;
  constants: string[];
  explanation: string;
  suggestedFix: string;
}

export function detectConstantConflicts(): ConstantConflict[] {
  const conflicts: ConstantConflict[] = [];

  // 1. Digit constants uniqueness
  const seen = new Set<string>();
  for (const d of DIGIT_CONSTANTS) {
    if (seen.has(d.digit)) {
      conflicts.push({
        conflictId: `DIGIT_DUP_${d.digit}`, severity: "HIGH",
        constants: [`DIGIT_${d.digit}`],
        explanation: `数字 ${d.digit} 含义重复定义`,
        suggestedFix: "保留 digitConstants.ts 中唯一定义",
      });
    }
    seen.add(d.digit);
  }

  // 2. Founder Locked override check
  const safetyConsts = listByCategory("SAFETY");
  for (const c of safetyConsts) {
    if (!c.founderLocked) {
      conflicts.push({
        conflictId: `SAFETY_UNLOCKED_${c.id}`, severity: "CRITICAL",
        constants: [c.id],
        explanation: "安全常数未 Founder Locked，可能被普通用户覆盖",
        suggestedFix: "设置 founderLocked=true",
      });
    }
  }

  // 3. Demo/Real mode isolation
  const modeConsts = listByCategory("SUBJECT_MODE");
  const demo = modeConsts.find((m) => m.id === "MODE_DEMO");
  const real = modeConsts.find((m) => m.id === "MODE_FULL_60");
  if (demo && real) {
    const demoVal = demo.value as { privacyLevel: string };
    const realVal = real.value as { privacyLevel: string };
    if (demoVal.privacyLevel === realVal.privacyLevel) {
      conflicts.push({
        conflictId: "DEMO_REAL_PRIVACY_SAME", severity: "CRITICAL",
        constants: ["MODE_DEMO", "MODE_FULL_60"],
        explanation: "Demo 与 Real 隐私等级相同，可能造成混淆",
        suggestedFix: "保持 Demo=PUBLIC_DEMO, Full60=LOCAL_PRIVATE",
      });
    }
  }

  // 4. Currency non-financial check
  const currencyLock = CONSTANT_REGISTRY.find((c) => c.id === "CURRENCY_NON_FINANCIAL_LOCKS");
  if (!currencyLock) {
    conflicts.push({
      conflictId: "CURRENCY_LOCKS_MISSING", severity: "CRITICAL",
      constants: ["CURRENCY_NON_FINANCIAL_LOCKS"],
      explanation: "缺失数列货币非金融锁定常数",
      suggestedFix: "添加 CURRENCY_NON_FINANCIAL_LOCKS 常数并 founderLocked",
    });
  } else {
    const val = currencyLock.value as Record<string, boolean>;
    if (val.CASH_REDEEMABLE || val.TRANSFERABLE || val.INVESTMENT_ASSET || !val.INTERNAL_ONLY) {
      conflicts.push({
        conflictId: "CURRENCY_FINANCIAL_BREACH", severity: "CRITICAL",
        constants: ["CURRENCY_NON_FINANCIAL_LOCKS"],
        explanation: "数列货币非金融边界被破坏",
        suggestedFix: "恢复 INTERNAL_ONLY=true 且其余=false",
      });
    }
  }

  return conflicts;
}

export function getConflictSummary(): { total: number; critical: number; high: number; medium: number; low: number } {
  const c = detectConstantConflicts();
  return {
    total: c.length,
    critical: c.filter((x) => x.severity === "CRITICAL").length,
    high: c.filter((x) => x.severity === "HIGH").length,
    medium: c.filter((x) => x.severity === "MEDIUM").length,
    low: c.filter((x) => x.severity === "LOW").length,
  };
}

let _ignored: ConstantDefinition | undefined;
void _ignored;
