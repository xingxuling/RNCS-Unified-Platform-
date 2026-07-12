import { BREAKTHROUGH_GAPS, getGap } from "@/constants/breakthroughGapTypes";
import type { FiveDomainMapping } from "./fiveDomainMappingEngine";
import type { BreakthroughObjectType } from "@/constants/breakthroughObjectTypes";

export interface ConstantGapResult {
  missingNumbers: number[];
  overactiveNumbers: number[];
  keyGap: string;
  gapExplanation: string;
  recommended补法: string[];
  matrix: { number: number; status: "缺" | "过载" | "正常"; note: string }[];
}

const TEXT_HITS: Array<{ n: number; re: RegExp }> = [
  { n: 0, re: /停不下|放不下|旧的|没清/ },
  { n: 1, re: /没人负责|主张|主权|我说了不算/ },
  { n: 2, re: /没用户|没人用|没反馈|没合作/ },
  { n: 3, re: /讲不清|看不懂|表达|传播|文案/ },
  { n: 4, re: /没流程|没规范|乱|sop|制度/ },
  { n: 5, re: /卡住|没变化|不动|没触发/ },
  { n: 6, re: /撑不住|疲惫|崩|承载|能量/ },
  { n: 7, re: /没看清|没研究|后台|深读/ },
  { n: 8, re: /没钱|资源不够|商业|定价/ },
  { n: 9, re: /没方向|长期|终局|意义/ },
];

const OVERACTIVE: Array<{ n: number; re: RegExp }> = [
  { n: 3, re: /到处发|过度宣传|刷屏/ },
  { n: 5, re: /频繁改方向|每天换/ },
  { n: 8, re: /疯狂扩张|烧钱/ },
];

export function detectConstantGaps(text: string, domains: FiveDomainMapping, objectType: BreakthroughObjectType): ConstantGapResult {
  const missing = new Set<number>();
  TEXT_HITS.forEach(({ n, re }) => { if (re.test(text)) missing.add(n); });
  // domain to constant biases
  if (domains.missingDomain.some((d) => d.includes("人"))) missing.add(2);
  if (domains.missingDomain.some((d) => d.includes("地"))) missing.add(4);
  if (domains.missingDomain.some((d) => d.includes("神"))) missing.add(9);
  if (domains.missingDomain.some((d) => d.includes("风"))) missing.add(5);
  if (domains.missingDomain.some((d) => d.includes("天"))) missing.add(0);

  objectType.commonGaps.forEach((g) => {
    const m = g.match(/缺(\d)/);
    if (m) missing.add(Number(m[1]));
  });

  const overactive = OVERACTIVE.filter(({ re }) => re.test(text)).map(({ n }) => n);

  if (missing.size === 0) missing.add(7); // default: 多做点深读

  const sortedMissing = [...missing].sort();
  const keyN = sortedMissing[0];
  const key = getGap(keyN)!;
  const matrix = BREAKTHROUGH_GAPS.map((g) => ({
    number: g.number,
    status: missing.has(g.number) ? "缺" : overactive.includes(g.number) ? "过载" : "正常",
    note: missing.has(g.number) ? g.shortage : overactive.includes(g.number) ? `${g.name}过载` : `${g.name} OK`,
  })) as ConstantGapResult["matrix"];

  return {
    missingNumbers: sortedMissing,
    overactiveNumbers: overactive,
    keyGap: `缺${keyN} · ${key.name}`,
    gapExplanation: key.shortage,
    recommended补法: key.remedy,
    matrix,
  };
}
