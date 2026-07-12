export interface MissingLayerSafetyResult {
  passed: boolean;
  violations: string[];
  notes: string[];
}

export function runMissingLayerSafetyGuard(recs: { recommendationType: string; title: string }[]): MissingLayerSafetyResult {
  const violations: string[] = [];
  for (const r of recs) {
    if (/金融化|证券化/.test(r.title)) violations.push(`禁止数列货币金融化建议：${r.title}`);
    if (/现实化|deploy.*real/i.test(r.title)) violations.push(`禁止虚拟现实化建议：${r.title}`);
    if (/公开 Founder|expose founder/i.test(r.title)) violations.push(`禁止公开 Founder-only：${r.title}`);
    if (/绕过 QA|绕过宪法/.test(r.title)) violations.push(`禁止绕过治理：${r.title}`);
  }
  return {
    passed: violations.length === 0,
    violations,
    notes: [
      "推荐遵守 Demo / Real / Founder 隔离",
      "推荐遵守 Vocal / Narrative / Model 边界",
      "推荐遵守 System Constitution",
    ],
  };
}
