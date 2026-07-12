// Sequence Core Engine — 解析数列为通用核心结构
import { SEQUENCE_DIGIT_MEANINGS, FIVE_DOMAIN_POSITIONS } from "@/constants/sequence-world/sequenceDigitMeanings";

export type SequenceMode = "DEMO" | "LIGHT_20" | "FULL_60" | "OBJECT" | "WORLD" | "FOUNDER";
export type SequenceTargetType = "SUBJECT" | "OBJECT" | "WORLD" | "NPC" | "ZONE" | "QUEST" | "EVENT";

export interface SequenceInput {
  id: string;
  name: string;
  sequenceMode: SequenceMode;
  sequences: string[];           // 每段为一行数字字符串，如 "12345"
  targetType: SequenceTargetType;
  context?: string;
}

export interface SequenceCoreProfile {
  id: string;
  name: string;
  sequenceMode: SequenceMode;
  targetType: SequenceTargetType;
  digitFrequency: Record<string, number>;
  dominantDigits: string[];      // 频率最高的 1-3 个
  missingDigits: string[];
  terminalPattern: string;       // 末段总结
  fiveDomainBias: {
    heaven: string; earth: string; human: string; spirit: string; wind: string;
  };
  complexityTier: "LOW" | "MEDIUM" | "HIGH" | "FOUNDER";
  generationBias: string[];
  riskFlags: string[];
}

function normalizeDigits(seqs: string[]): string[][] {
  return seqs
    .map(s => (s || "").replace(/[^\d]/g, "").split(""))
    .filter(row => row.length > 0);
}

function pickComplexity(mode: SequenceMode, rowCount: number): SequenceCoreProfile["complexityTier"] {
  if (mode === "FOUNDER") return "FOUNDER";
  if (mode === "FULL_60" || rowCount >= 40) return "HIGH";
  if (mode === "LIGHT_20" || rowCount >= 10) return "MEDIUM";
  return "LOW";
}

export function buildSequenceCoreProfile(input: SequenceInput): SequenceCoreProfile {
  const rows = normalizeDigits(input.sequences);
  const freq: Record<string, number> = {};
  for (let i = 0; i <= 9; i++) freq[String(i)] = 0;
  rows.forEach(row => row.forEach(d => { freq[d] = (freq[d] ?? 0) + 1; }));

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  const dominantDigits = sorted.filter(([, n]) => n > 0).slice(0, 3).map(([d]) => d);
  const missingDigits = sorted.filter(([, n]) => n === 0).map(([d]) => d);

  // five-domain bias by column index 0..4
  const colCount: Array<Record<string, number>> = Array.from({ length: 5 }, () => ({}));
  rows.forEach(row => {
    row.slice(0, 5).forEach((d, i) => { colCount[i][d] = (colCount[i][d] ?? 0) + 1; });
  });
  const colTop = (i: number) => {
    const e = Object.entries(colCount[i] || {}).sort((a, b) => b[1] - a[1])[0];
    if (!e) return "—";
    const m = SEQUENCE_DIGIT_MEANINGS[e[0]];
    return `${e[0]}·${m?.keyword ?? ""}`;
  };
  const fiveDomainBias = {
    heaven: colTop(0), earth: colTop(1), human: colTop(2), spirit: colTop(3), wind: colTop(4),
  };

  // terminal pattern from last row
  const last = rows[rows.length - 1] ?? [];
  const terminalPattern = last.length
    ? `末段 ${last.join("·")} → 收束在 ${SEQUENCE_DIGIT_MEANINGS[last[last.length - 1]]?.keyword ?? "未知"}`
    : "末段为空";

  const generationBias: string[] = [];
  dominantDigits.forEach(d => {
    const m = SEQUENCE_DIGIT_MEANINGS[d];
    if (m) generationBias.push(`主导 ${d}（${m.keyword}）→ 倾向 ${m.themes.slice(0, 2).join("、")}`);
  });
  if (missingDigits.length >= 4) generationBias.push(`缺失数 ${missingDigits.join("·")} → 该层面在世界中较弱`);

  const riskFlags: string[] = [];
  if (input.sequenceMode === "FULL_60") riskFlags.push("Full60 高敏感：含隐私信息，请本地保存");
  if (total === 0) riskFlags.push("数列为空：仅生成 Demo 默认参数");
  if (dominantDigits.includes("0") && (freq["0"] ?? 0) >= total * 0.4) riskFlags.push("0 过载：世界倾向冻结/封存");
  if ((freq["5"] ?? 0) >= total * 0.4) riskFlags.push("5 过载：事件压力高，注意复杂度");

  return {
    id: input.id,
    name: input.name,
    sequenceMode: input.sequenceMode,
    targetType: input.targetType,
    digitFrequency: freq,
    dominantDigits: dominantDigits.length ? dominantDigits : ["5"],
    missingDigits,
    terminalPattern,
    fiveDomainBias,
    complexityTier: pickComplexity(input.sequenceMode, rows.length),
    generationBias,
    riskFlags,
  };
}

export { FIVE_DOMAIN_POSITIONS };
