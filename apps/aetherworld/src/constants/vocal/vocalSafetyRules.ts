export interface VocalSafetyRule {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  recommendation: string;
  patterns?: RegExp[];
}

export const VOCAL_SAFETY_RULES: VocalSafetyRule[] = [
  {
    id: "no-medical-diagnosis",
    severity: "CRITICAL",
    description: "声乐引擎不是医学嗓音诊断。",
    recommendation: "出现疼痛、失声、持续不适请就医或找声乐老师。",
  },
  {
    id: "no-push-high-note",
    severity: "CRITICAL",
    description: "不应建议用户硬顶高音。",
    recommendation: "改用降调、变调、混声或假声策略。",
    patterns: [/硬顶高音/, /强行飙高/, /push through pain/i],
  },
  {
    id: "stop-when-pain",
    severity: "CRITICAL",
    description: "嗓子疼痛仍鼓励继续高强度演唱。",
    recommendation: "明确提示：嗓子疼立即停止，休息，必要时就医。",
    patterns: [/疼.*继续唱/, /忍着继续/, /sing through the pain/i],
  },
  {
    id: "no-viral-guarantee",
    severity: "HIGH",
    description: "声乐输出不应承诺歌曲必火。",
    recommendation: "改为：可能受欢迎 / 适合该平台。",
    patterns: [/必火/, /一定爆/, /guaranteed hit/i],
  },
  {
    id: "suno-title-in-lyric",
    severity: "MEDIUM",
    description: "Suno 歌词区不应包含标题，否则可能被唱出。",
    recommendation: "标题写到 Style 字段或独立说明。",
  },
  {
    id: "missing-safety-note",
    severity: "HIGH",
    description: "输出缺少声乐安全说明。",
    recommendation: "必须附上声乐安全说明。",
  },
  {
    id: "no-non-lyric-in-lyric",
    severity: "MEDIUM",
    description: "歌词区混入非歌词说明（如方括号注释以外的中文备注）。",
    recommendation: "只在歌词区保留段落标签和歌词正文。",
  },
];
