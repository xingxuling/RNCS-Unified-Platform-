import { MSLStatement, MSLBlockRef } from "./mslParser";
import { MSL_BLOCKS, MSLBlockDef } from "@/constants/msl/mslBlockTypes";
import { getOpcode } from "@/constants/msl/mslOpcodes";

export interface MSLBlockAnalysis {
  blockName: string;
  blockZh: string;
  startIndex: number;
  endIndex: number;
  phaseType: string;
  dominantDigits: string[];
  terminalPattern: string;
  narrativeArc: string;
  engineMeaning: string;
  recommendedEngines: string[];
  matchedStatementCount: number;
}

export function analyzeBlock(ref: MSLBlockRef, all: MSLStatement[]): MSLBlockAnalysis {
  const def: MSLBlockDef =
    MSL_BLOCKS.find(b => b.startIndex === ref.startIndex && b.endIndex === ref.endIndex) ?? {
      name: `Block ${ref.startIndex}..${ref.endIndex}`,
      zh: `区块 ${ref.startIndex}..${ref.endIndex}`,
      startIndex: ref.startIndex,
      endIndex: ref.endIndex,
      phaseType: "CUSTOM",
      narrativeArc: "自定义区块",
      engineMeaning: "自定义区块语义",
      recommendedEngines: [],
    };

  const inBlock = all.filter(s => s.index !== undefined && s.index >= ref.startIndex && s.index <= ref.endIndex);
  const allDigits = inBlock.flatMap(s => s.digits);
  const counts: Record<string, number> = {};
  allDigits.forEach(d => { counts[d] = (counts[d] ?? 0) + 1; });
  const dominantDigits = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([d, c]) => `${d}=${getOpcode(d).name}×${c}`);

  const terminals = inBlock.map(s => s.digits[4]);
  const tCounts: Record<string, number> = {};
  terminals.forEach(t => { tCounts[t] = (tCounts[t] ?? 0) + 1; });
  const sortedT = Object.entries(tCounts).sort((a, b) => b[1] - a[1]);
  const terminalPattern = sortedT.length
    ? `主流终端：${sortedT.map(([d, c]) => `${d}=${getOpcode(d).name}×${c}`).join("，")}`
    : "无可分析的终端";

  return {
    blockName: def.name,
    blockZh: def.zh,
    startIndex: def.startIndex,
    endIndex: def.endIndex,
    phaseType: def.phaseType,
    dominantDigits,
    terminalPattern,
    narrativeArc: def.narrativeArc,
    engineMeaning: def.engineMeaning,
    recommendedEngines: def.recommendedEngines,
    matchedStatementCount: inBlock.length,
  };
}
