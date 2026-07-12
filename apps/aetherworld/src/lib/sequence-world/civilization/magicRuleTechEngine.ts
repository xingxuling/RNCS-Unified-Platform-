// Magic-Rule-Tech Engine
import { MAGIC_RULE_TECH_LABELS, type MagicRuleTechMode } from "@/constants/sequence-world/civilization/magicRuleTechTypes";

export interface MagicRuleTechState {
  magicLevel: number;
  technologyLevel: number;
  ruleLevel: number;
  sequenceIntegrationLevel: number;
  balance: string;
  instabilityRisk: number;
  dominantMode: MagicRuleTechMode;
  modeLabel: string;
}

export function computeMagicRuleTech(input: {
  sourceDigits?: string[]; techLevel?: number;
}): MagicRuleTechState {
  const d = input.sourceDigits ?? [];
  const cnt = (x: string) => d.filter(y => y === x).length;
  const magic = Math.min(1, 0.2 + cnt("9") * 0.15 + cnt("7") * 0.1);
  const tech = Math.min(1, 0.2 + cnt("8") * 0.15 + (input.techLevel ?? 0) * 0.05);
  const rule = Math.min(1, 0.2 + cnt("4") * 0.2);
  const seq = Math.min(1, 0.2 + cnt("3") * 0.1 + cnt("1") * 0.1);

  const entries: [MagicRuleTechMode, number][] = [
    ["MAGIC_DOMINANT", magic], ["TECH_DOMINANT", tech],
    ["RULE_DOMINANT", rule], ["SEQUENCE_DOMINANT", seq],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  const [top, second] = entries;
  let dominantMode: MagicRuleTechMode = top[0];
  if (Math.abs(top[1] - second[1]) < 0.1) dominantMode = "HYBRID_BALANCED";
  const instability = Math.min(1, cnt("5") * 0.2 + (top[1] > 0.8 ? 0.2 : 0));
  if (instability > 0.6) dominantMode = "UNSTABLE_OVERLAP";

  return {
    magicLevel: +magic.toFixed(2),
    technologyLevel: +tech.toFixed(2),
    ruleLevel: +rule.toFixed(2),
    sequenceIntegrationLevel: +seq.toFixed(2),
    balance: dominantMode === "HYBRID_BALANCED" ? "均衡" : dominantMode === "UNSTABLE_OVERLAP" ? "不稳定" : "倾斜",
    instabilityRisk: +instability.toFixed(2),
    dominantMode,
    modeLabel: MAGIC_RULE_TECH_LABELS[dominantMode],
  };
}
