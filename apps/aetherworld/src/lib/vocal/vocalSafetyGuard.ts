import { VOCAL_SAFETY_RULES, VocalSafetyRule } from "@/constants/vocal/vocalSafetyRules";

export interface VocalSafetyViolation {
  rule: VocalSafetyRule;
  matched?: string;
}

export interface VocalSafetyResult {
  passed: boolean;
  violations: VocalSafetyViolation[];
  notes: string[];
}

export function checkVocalSafety(text: string, options?: { hasSafetyNote?: boolean; isLyricRegion?: boolean; lyricContainsTitle?: boolean }): VocalSafetyResult {
  const violations: VocalSafetyViolation[] = [];
  for (const rule of VOCAL_SAFETY_RULES) {
    if (rule.patterns) {
      for (const p of rule.patterns) {
        const m = text.match(p);
        if (m) violations.push({ rule, matched: m[0] });
      }
    }
  }
  if (options?.hasSafetyNote === false) {
    violations.push({ rule: VOCAL_SAFETY_RULES.find(r => r.id === "missing-safety-note")! });
  }
  if (options?.isLyricRegion && options?.lyricContainsTitle) {
    violations.push({ rule: VOCAL_SAFETY_RULES.find(r => r.id === "suno-title-in-lyric")! });
  }
  return {
    passed: violations.filter(v => v.rule.severity === "CRITICAL" || v.rule.severity === "HIGH").length === 0,
    violations,
    notes: [
      "声乐引擎提供声线设计与练唱参考，不替代医学嗓音诊断或专业声乐老师。",
      "出现疼痛、失声、持续不适请停止演唱并寻求专业意见。",
      "系统不保证某首歌一定适合演唱，也不保证生成歌曲一定爆火。",
    ],
  };
}

export function safetyNoteText(): string {
  return [
    "声乐引擎提供的是声线设计、演唱建议、AI 音乐提示词和练唱参考。",
    "它不是医学嗓音诊断，也不替代专业声乐老师。",
    "嗓子疼痛、失声、持续不适请停止高强度演唱并寻求专业意见。",
    "系统不保证某首歌一定适合演唱，不保证生成歌曲必火。",
  ].join("\n");
}
