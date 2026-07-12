// World Simulation Safety Guard
import { WORLD_SIM_SAFETY_RULES, WORLD_SIM_DISCLAIMERS } from "@/constants/sequence-world/simulation/worldSimulationSafetyRules";

export interface WorldSimSafetyCheck {
  passed: boolean;
  violations: Array<{ ruleId: string; severity: string; message: string }>;
  disclaimers: string[];
}

const FORBIDDEN_PATTERNS = [
  /必然发生/, /等于现实/, /对应现实人物/, /真实预言/, /保证发生/,
];

export function runWorldSimSafetyCheck(opts: {
  text?: string;
  isFull60?: boolean;
  hasPrivacyNote?: boolean;
  tickCount?: number;
  tickCap?: number;
  hasMetadata?: boolean;
}): WorldSimSafetyCheck {
  const violations: WorldSimSafetyCheck["violations"] = [];
  if (opts.text) {
    for (const p of FORBIDDEN_PATTERNS) {
      if (p.test(opts.text)) violations.push({ ruleId: "no-reality-claim", severity: "CRITICAL", message: `输出含禁止断言：${p}` });
    }
  }
  if (opts.isFull60 && !opts.hasPrivacyNote) {
    violations.push({ ruleId: "full60-export-confirm", severity: "HIGH", message: "Full60 世界缺少隐私确认" });
  }
  if (opts.tickCount && opts.tickCap && opts.tickCount > opts.tickCap) {
    violations.push({ ruleId: "no-infinite-tick", severity: "HIGH", message: `tick ${opts.tickCount} 超过上限 ${opts.tickCap}` });
  }
  if (opts.tickCap === undefined) {
    violations.push({ ruleId: "tick-must-have-cap", severity: "MEDIUM", message: "tick 缺少上限保护" });
  }
  if (opts.hasMetadata === false) {
    violations.push({ ruleId: "fiction-not-real-knowledge", severity: "MEDIUM", message: "导出缺少 metadata" });
  }
  return {
    passed: violations.filter(v => v.severity === "CRITICAL").length === 0,
    violations,
    disclaimers: [...WORLD_SIM_DISCLAIMERS],
  };
}

export { WORLD_SIM_SAFETY_RULES };
