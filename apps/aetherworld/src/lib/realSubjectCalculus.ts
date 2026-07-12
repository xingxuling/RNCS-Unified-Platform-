// Real Subject Calculus Engine · 真实用户主体计算法
import {
  CYCLE_META,
  FIVE_DOMAIN_KEYS,
  type CycleKey,
  type FiveDomainKey,
} from "@/constants/subjectSequenceModes";

// ============================================================
// 类型
// ============================================================

export type FiveDomainTotals = Record<FiveDomainKey, number>;
export type DigitFrequency = Record<number, number>; // 0-9

export interface CycleAnalysis {
  key: CycleKey;
  cn: string;
  en: string;
  range: [number, number];
  rows: number[][];
  domainTotals: FiveDomainTotals;
  domainAverages: FiveDomainTotals;
  domainVariance: FiveDomainTotals;
  digitFrequency: DigitFrequency;
  terminalFrequency: DigitFrequency;
  dominantTerminal: number;
  topDigits: { d: number; c: number }[];
  missingDigits: number[];
  strongestDomain: FiveDomainKey;
  weakestDomain: FiveDomainKey;
  mostStableDomain: FiveDomainKey;
  mostVolatileDomain: FiveDomainKey;
  interpretation: string;
}

export interface CycleDiff {
  fromCycle: CycleKey;
  toCycle: CycleKey;
  domainDelta: FiveDomainTotals;       // 增减（avg 差）
  strongerDomains: FiveDomainKey[];
  weakerDomains: FiveDomainKey[];
  digitDelta: Record<number, number>;  // 频率差
  reinforcedDigits: number[];          // 增加显著
  fadedDigits: number[];               // 减少显著
  notes: string[];
}

export interface TerminalPattern {
  terminalFrequencies: DigitFrequency;
  dominantTerminal: number;
  terminalConcentrationScore: number; // 0-100
  singularityLikePattern: boolean;
  interpretation: string;
}

export interface FiveDomainFullAnalysis {
  domainTotals: FiveDomainTotals;
  domainAverages: FiveDomainTotals;
  domainVariance: FiveDomainTotals;
  strongestDomain: FiveDomainKey;
  weakestDomain: FiveDomainKey;
  mostStableDomain: FiveDomainKey;
  mostVolatileDomain: FiveDomainKey;
  domainInterpretation: string;
}

export interface FullSubjectAnalysis {
  rows: number[][];                    // 60 行
  cycles: Record<CycleKey, CycleAnalysis>;
  fiveDomain: FiveDomainFullAnalysis;
  terminal: TerminalPattern;
  diffs: { c1_c2: CycleDiff; c2_c3: CycleDiff; c1_c3: CycleDiff };
  mainlineRisingDigits: number[];      // 三轮持续增强
  fadingDigits: number[];              // 三轮持续衰减
  cycleConsistency: number;            // 0-100：三轮事件类型一致性的粗略指标
  dominantCycle: CycleKey;             // 最强循环
  summary: string;
}

// ============================================================
// 数列解析 / 校验
// ============================================================

export interface ParseResult {
  rows: number[][];
  errors: string[];
  warnings: string[];
}

/**
 * 解析批量粘贴文本。
 * 支持：
 *  - "1，01325" / "1,01325" / "1: 01325" / "1 01325" / 单行 "01325"
 *  - 中英文逗号、冒号、空格、换行、制表符混合
 *  - 自动忽略空行与多余字符
 */
export function parseSequenceText(input: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: number[][] = [];

  // 统一分隔
  const lines = input
    .replace(/\r/g, "")
    .replace(/[，：]/g, ",")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const raw of lines) {
    // 抓取所有 5 位数字 token（允许 0 开头）
    const tokens = raw.match(/\d{5}/g);
    if (!tokens || tokens.length === 0) {
      // 含数字但不足5位
      if (/\d/.test(raw)) warnings.push(`已忽略无效行：${raw}`);
      continue;
    }
    // 一行可能既含序号又含数列，例如 "1, 01325"
    // 取最后一个 5 位 token 作为数列（更稳健）
    const token = tokens[tokens.length - 1];
    rows.push(token.split("").map((c) => parseInt(c, 10)));
  }

  if (rows.length === 0) errors.push("未解析到任何 5 位数字行。");

  return { rows, errors, warnings };
}

export function validateRows(rows: number[][], expected: 20 | 60): string[] {
  const errs: string[] = [];
  if (rows.length !== expected) {
    errs.push(`需要 ${expected} 组，当前 ${rows.length} 组。`);
  }
  rows.forEach((r, i) => {
    if (r.length !== 5) errs.push(`第 ${i + 1} 组不是 5 位。`);
    if (r.some((d) => !Number.isInteger(d) || d < 0 || d > 9)) {
      errs.push(`第 ${i + 1} 组包含非 0–9 数字。`);
    }
  });
  return errs;
}

// ============================================================
// 工具
// ============================================================

const POS_TO_DOMAIN: FiveDomainKey[] = ["heaven", "earth", "human", "spirit", "wind"];

function emptyDomainTotals(): FiveDomainTotals {
  return { heaven: 0, earth: 0, human: 0, spirit: 0, wind: 0 };
}

function emptyDigitFreq(): DigitFrequency {
  const f: DigitFrequency = {};
  for (let i = 0; i < 10; i++) f[i] = 0;
  return f;
}

function findExtreme(totals: FiveDomainTotals, mode: "max" | "min"): FiveDomainKey {
  let best: FiveDomainKey = "heaven";
  let bestVal = mode === "max" ? -Infinity : Infinity;
  for (const k of FIVE_DOMAIN_KEYS) {
    const v = totals[k];
    if (mode === "max" ? v > bestVal : v < bestVal) {
      best = k;
      bestVal = v;
    }
  }
  return best;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, v) => a + (v - avg) ** 2, 0) / values.length;
}

// ============================================================
// 单循环分析
// ============================================================

export function analyzeCycle(rows: number[][], key: CycleKey): CycleAnalysis {
  const meta = CYCLE_META.find((c) => c.key === key)!;
  const totals = emptyDomainTotals();
  const perDomain: Record<FiveDomainKey, number[]> = {
    heaven: [], earth: [], human: [], spirit: [], wind: [],
  };
  const digitFreq = emptyDigitFreq();
  const terminalFreq = emptyDigitFreq();

  rows.forEach((row) => {
    row.forEach((d, i) => {
      const dom = POS_TO_DOMAIN[i];
      totals[dom] += d;
      perDomain[dom].push(d);
      digitFreq[d] = (digitFreq[d] ?? 0) + 1;
    });
    terminalFreq[row[4]] = (terminalFreq[row[4]] ?? 0) + 1;
  });

  const n = rows.length || 1;
  const averages: FiveDomainTotals = {
    heaven: totals.heaven / n,
    earth: totals.earth / n,
    human: totals.human / n,
    spirit: totals.spirit / n,
    wind: totals.wind / n,
  };
  const varianceMap: FiveDomainTotals = {
    heaven: variance(perDomain.heaven),
    earth: variance(perDomain.earth),
    human: variance(perDomain.human),
    spirit: variance(perDomain.spirit),
    wind: variance(perDomain.wind),
  };

  const sortedDigits = Object.entries(digitFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([d, c]) => ({ d: +d, c }));
  const topDigits = sortedDigits.slice(0, 3);
  const missingDigits = sortedDigits.filter((x) => x.c === 0).map((x) => x.d);

  const strongestDomain = findExtreme(averages, "max");
  const weakestDomain = findExtreme(averages, "min");
  const mostStableDomain = findExtreme(varianceMap, "min");
  const mostVolatileDomain = findExtreme(varianceMap, "max");

  const terminalEntries = Object.entries(terminalFreq).sort((a, b) => b[1] - a[1]);
  const dominantTerminal = +terminalEntries[0][0];

  const interpretation =
    `${meta.cn}（${meta.range[0]}–${meta.range[1]}）：` +
    `最强域为「${strongestDomain}」，最弱域为「${weakestDomain}」；` +
    `终端高频为 ${dominantTerminal}。`;

  return {
    key,
    cn: meta.cn,
    en: meta.en,
    range: meta.range,
    rows,
    domainTotals: totals,
    domainAverages: averages,
    domainVariance: varianceMap,
    digitFrequency: digitFreq,
    terminalFrequency: terminalFreq,
    dominantTerminal,
    topDigits,
    missingDigits,
    strongestDomain,
    weakestDomain,
    mostStableDomain,
    mostVolatileDomain,
    interpretation,
  };
}

// ============================================================
// 循环对比
// ============================================================

const DOMAIN_LABEL_CN: Record<FiveDomainKey, string> = {
  heaven: "天", earth: "地", human: "人", spirit: "神", wind: "风",
};

export function diffCycles(a: CycleAnalysis, b: CycleAnalysis): CycleDiff {
  const domainDelta = emptyDomainTotals();
  const strongerDomains: FiveDomainKey[] = [];
  const weakerDomains: FiveDomainKey[] = [];

  for (const k of FIVE_DOMAIN_KEYS) {
    const d = b.domainAverages[k] - a.domainAverages[k];
    domainDelta[k] = d;
    if (d >= 0.6) strongerDomains.push(k);
    else if (d <= -0.6) weakerDomains.push(k);
  }

  const digitDelta: Record<number, number> = {};
  for (let i = 0; i < 10; i++) {
    digitDelta[i] = (b.digitFrequency[i] ?? 0) - (a.digitFrequency[i] ?? 0);
  }
  const reinforcedDigits = Object.entries(digitDelta)
    .filter(([, v]) => v >= 2)
    .map(([d]) => +d);
  const fadedDigits = Object.entries(digitDelta)
    .filter(([, v]) => v <= -2)
    .map(([d]) => +d);

  const notes: string[] = [];
  strongerDomains.forEach((k) =>
    notes.push(`${DOMAIN_LABEL_CN[k]}域增强：从 ${a.key} 到 ${b.key} 显著上行。`),
  );
  weakerDomains.forEach((k) =>
    notes.push(`${DOMAIN_LABEL_CN[k]}域减弱：从 ${a.key} 到 ${b.key} 显著下行。`),
  );
  if (reinforcedDigits.length)
    notes.push(`增强数字：${reinforcedDigits.join("、")}（更频繁出现）。`);
  if (fadedDigits.length)
    notes.push(`衰减数字：${fadedDigits.join("、")}（明显退场）。`);
  if (b.dominantTerminal !== a.dominantTerminal) {
    notes.push(`终端漂移：${a.dominantTerminal} → ${b.dominantTerminal}（风域终端发生迁移）。`);
  } else {
    notes.push(`终端稳定：持续收束于 ${a.dominantTerminal}。`);
  }

  return { fromCycle: a.key, toCycle: b.key, domainDelta, strongerDomains, weakerDomains, digitDelta, reinforcedDigits, fadedDigits, notes };
}

// ============================================================
// 终端模式分析（60 组终端集中度）
// ============================================================

export function analyzeTerminal(rows: number[][]): TerminalPattern {
  const freq = emptyDigitFreq();
  rows.forEach((r) => { freq[r[4]] = (freq[r[4]] ?? 0) + 1; });

  const total = rows.length || 1;
  const entries = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const dominantTerminal = +entries[0][0];
  const top1 = entries[0][1];
  const top2 = entries[1]?.[1] ?? 0;

  // 集中度：top1 占比 + top1/top2 拉开度
  const ratio = top1 / total;
  const gap = top1 - top2;
  const score = Math.round(Math.min(100, ratio * 100 * 0.7 + (gap / total) * 100 * 0.6));
  const singularity = score >= 55;

  const interpretation = singularity
    ? `终端数字高度集中于 ${dominantTerminal}，多域输入最终倾向收束至同一终端，系统将其标记为风域收束结构 / 变局核。`
    : `终端分布较为分散，未形成显著收束结构。`;

  return {
    terminalFrequencies: freq,
    dominantTerminal,
    terminalConcentrationScore: score,
    singularityLikePattern: singularity,
    interpretation,
  };
}

// ============================================================
// 五域完整分析（基于全部 60 组）
// ============================================================

export function analyzeFiveDomainFull(rows: number[][]): FiveDomainFullAnalysis {
  const totals = emptyDomainTotals();
  const per: Record<FiveDomainKey, number[]> = {
    heaven: [], earth: [], human: [], spirit: [], wind: [],
  };
  rows.forEach((r) => {
    r.forEach((d, i) => {
      const k = POS_TO_DOMAIN[i];
      totals[k] += d;
      per[k].push(d);
    });
  });
  const n = rows.length || 1;
  const averages: FiveDomainTotals = {
    heaven: totals.heaven / n,
    earth: totals.earth / n,
    human: totals.human / n,
    spirit: totals.spirit / n,
    wind: totals.wind / n,
  };
  const varianceMap: FiveDomainTotals = {
    heaven: variance(per.heaven),
    earth: variance(per.earth),
    human: variance(per.human),
    spirit: variance(per.spirit),
    wind: variance(per.wind),
  };
  const strongestDomain = findExtreme(averages, "max");
  const weakestDomain = findExtreme(averages, "min");
  const mostStableDomain = findExtreme(varianceMap, "min");
  const mostVolatileDomain = findExtreme(varianceMap, "max");

  const domainInterpretation =
    `完整 60 组数列：最强为「${DOMAIN_LABEL_CN[strongestDomain]}」域，最弱为「${DOMAIN_LABEL_CN[weakestDomain]}」域；` +
    `最稳定为「${DOMAIN_LABEL_CN[mostStableDomain]}」域，最波动为「${DOMAIN_LABEL_CN[mostVolatileDomain]}」域。`;

  return {
    domainTotals: totals,
    domainAverages: averages,
    domainVariance: varianceMap,
    strongestDomain,
    weakestDomain,
    mostStableDomain,
    mostVolatileDomain,
    domainInterpretation,
  };
}

// ============================================================
// 顶层：完整主体分析
// ============================================================

export function analyzeFullSubject(rows60: number[][]): FullSubjectAnalysis {
  if (rows60.length !== 60) {
    throw new Error(`analyzeFullSubject 需要 60 组，得到 ${rows60.length} 组`);
  }
  const c1 = analyzeCycle(rows60.slice(0, 20), "C1");
  const c2 = analyzeCycle(rows60.slice(20, 40), "C2");
  const c3 = analyzeCycle(rows60.slice(40, 60), "C3");
  const fiveDomain = analyzeFiveDomainFull(rows60);
  const terminal = analyzeTerminal(rows60);

  const d12 = diffCycles(c1, c2);
  const d23 = diffCycles(c2, c3);
  const d13 = diffCycles(c1, c3);

  // 持续增强 / 持续衰减
  const mainlineRisingDigits: number[] = [];
  const fadingDigits: number[] = [];
  for (let d = 0; d <= 9; d++) {
    const f1 = c1.digitFrequency[d] ?? 0;
    const f2 = c2.digitFrequency[d] ?? 0;
    const f3 = c3.digitFrequency[d] ?? 0;
    if (f3 > f2 && f2 > f1 && f3 - f1 >= 2) mainlineRisingDigits.push(d);
    if (f3 < f2 && f2 < f1 && f1 - f3 >= 2) fadingDigits.push(d);
  }

  // 三轮事件类型一致性：用最强域 + 主导终端 重合度估算
  let consistency = 0;
  if (c1.strongestDomain === c2.strongestDomain) consistency += 25;
  if (c2.strongestDomain === c3.strongestDomain) consistency += 25;
  if (c1.dominantTerminal === c3.dominantTerminal) consistency += 20;
  if (c1.strongestDomain === c3.strongestDomain) consistency += 30;
  consistency = Math.min(100, consistency);

  // 主导循环：domain average 总和最高者
  const cycleScore = (c: CycleAnalysis) =>
    FIVE_DOMAIN_KEYS.reduce((s, k) => s + c.domainAverages[k], 0);
  const scored: { key: CycleKey; v: number }[] = (
    [
      { key: "C1" as CycleKey, v: cycleScore(c1) },
      { key: "C2" as CycleKey, v: cycleScore(c2) },
      { key: "C3" as CycleKey, v: cycleScore(c3) },
    ]
  ).sort((a, b) => b.v - a.v);
  const dominantCycle = scored[0].key;

  const summary =
    `完整主体：最强域「${DOMAIN_LABEL_CN[fiveDomain.strongestDomain]}」，` +
    `终端${terminal.singularityLikePattern ? `高度收束于 ${terminal.dominantTerminal}` : "分布较散"}，` +
    `三循环一致性 ${consistency}/100，主导循环 ${dominantCycle}。`;

  return {
    rows: rows60,
    cycles: { C1: c1, C2: c2, C3: c3 },
    fiveDomain,
    terminal,
    diffs: { c1_c2: d12, c2_c3: d23, c1_c3: d13 },
    mainlineRisingDigits,
    fadingDigits,
    cycleConsistency: consistency,
    dominantCycle,
    summary,
  };
}

// ============================================================
// 触发日历接入：dayOffset → 序列位 / Cycle
// ============================================================

export interface FullScanHit {
  index: number;        // 1-60
  cycle: CycleKey;
  row: number[];
  lightSliceIndex: number; // 1-20
}

export function fullScanHit(dayOffset: number, rows60: number[][]): FullScanHit {
  const idx0 = ((dayOffset % 60) + 60) % 60; // 0-59
  const index = idx0 + 1;
  const cycle: CycleKey = idx0 < 20 ? "C1" : idx0 < 40 ? "C2" : "C3";
  const lightSliceIndex = (((dayOffset % 20) + 20) % 20) + 1;
  return { index, cycle, row: rows60[idx0], lightSliceIndex };
}

// ============================================================
// 模拟 60 组（仅用于演示）
// ============================================================

export function generateMockFullSequence(seed = Date.now()): number[][] {
  // 简单确定性 PRNG
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const rows: number[][] = [];
  for (let i = 0; i < 60; i++) {
    rows.push(Array.from({ length: 5 }, () => Math.floor(rand() * 10)));
  }
  return rows;
}
