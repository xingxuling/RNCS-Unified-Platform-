// 虚拟世界种子层（基于已有 worldSeedCompiler 之上加一层"虚拟世界专用"信息）
import type { SubjectModel } from "./types";
import { compileWorldSeed, type WorldSeed } from "./worldSeedCompiler";

export interface VirtualWorldSeedInput {
  subjectMode: "DEMO" | "LIGHT_20" | "FULL_60" | "IMPORTED";
  subject: SubjectModel | null;
  selectedWorldMode: string;
}

export interface VirtualWorldSeedResult {
  seedSignature: string;
  seedName: string;
  dominantNumber: number;
  dominantDomain: string;
  weakDomain: string;
  missingNumbers: number[];
  terminalPattern: string;
  cycleProfile: { cycle1Role: string; cycle2Role: string; cycle3Role: string };
  worldGenerationBias: string[];
  seedInterpretation: string;
  base: WorldSeed;
}

const DOMAIN_BY_NUMBER: Record<number, string> = {
  0: "shen", 1: "tian", 2: "ren", 3: "feng", 4: "di",
  5: "feng", 6: "ren", 7: "shen", 8: "di", 9: "tian",
};

const DOMAIN_LABEL: Record<string, string> = {
  tian: "天域", di: "地域", ren: "人域", shen: "神域", feng: "风域",
};

function rolesByCycle(digits: number[][]): { cycle1Role: string; cycle2Role: string; cycle3Role: string } {
  const seg = (start: number, end: number) => {
    const all = digits.slice(start, end).flat();
    const freq: Record<number, number> = {};
    all.forEach(d => { freq[d] = (freq[d] ?? 0) + 1; });
    let best = 5, m = -1;
    for (const k of Object.keys(freq)) {
      const n = Number(k);
      if (freq[n] > m) { m = freq[n]; best = n; }
    }
    return `主导数 ${best}（${DOMAIN_LABEL[DOMAIN_BY_NUMBER[best]]}）`;
  };
  const n = digits.length || 1;
  return {
    cycle1Role: seg(0, Math.ceil(n / 3)),
    cycle2Role: seg(Math.ceil(n / 3), Math.ceil((n * 2) / 3)),
    cycle3Role: seg(Math.ceil((n * 2) / 3), n),
  };
}

export function compileVirtualWorldSeed(input: VirtualWorldSeedInput): VirtualWorldSeedResult {
  const base = compileWorldSeed(input.subject, input.selectedWorldMode);
  const dominantDomain = DOMAIN_BY_NUMBER[base.dominantNumber] ?? "ren";
  const presentDomains = Object.entries(base.digitFrequency)
    .filter(([, v]) => v > 0)
    .map(([k]) => DOMAIN_BY_NUMBER[Number(k)]);
  const allDomains = ["tian", "di", "ren", "shen", "feng"];
  const weakDomain = allDomains.find(d => !presentDomains.includes(d)) ?? "feng";

  const digits = input.subject?.digits ?? [];
  const last = digits[digits.length - 1] ?? [];
  const terminalPattern = last.length
    ? `末段：${last.join("·")}（收束于 ${DOMAIN_LABEL[DOMAIN_BY_NUMBER[last[last.length - 1]] ?? "ren"]}）`
    : "末段未生成";

  const bias = [
    `主导 ${DOMAIN_LABEL[dominantDomain]} 倾向`,
    base.missingNumbers.length ? `缺失数 ${base.missingNumbers.join("·")}` : "数列覆盖完整",
    `${input.selectedWorldMode} 偏向`,
  ];

  const seedName = `${DOMAIN_LABEL[dominantDomain]}·${base.signature}`;
  const interpretation = `这是你的世界底层倾向，会影响世界法则、出生区域、任务类型和 NPC 关系。当前主导域为${DOMAIN_LABEL[dominantDomain]}，薄弱域为${DOMAIN_LABEL[weakDomain]}。`;

  return {
    seedSignature: base.signature,
    seedName,
    dominantNumber: base.dominantNumber,
    dominantDomain,
    weakDomain,
    missingNumbers: base.missingNumbers,
    terminalPattern,
    cycleProfile: rolesByCycle(digits),
    worldGenerationBias: bias,
    seedInterpretation: interpretation,
    base,
  };
}
