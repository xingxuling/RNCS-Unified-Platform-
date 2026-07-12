// 文案安全规则 Copy Safety Rules
export interface CopySafetyRule {
  id: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "CRITICAL";
  patterns: string[];
  suggestion: string;
}

export const COPY_SAFETY_RULES: CopySafetyRule[] = [
  { id: "NO_ABSOLUTE_FUTURE", description: "不要绝对预测未来。", severity: "CRITICAL",
    patterns: ["必然发生", "一定会", "命中注定", "保证发生", "100% 准确", "100%准确"],
    suggestion: "改为：可能表现为 / 当前更倾向于 / 建议观察。" },
  { id: "NO_ACCURACY_GUARANTEE", description: "不要承诺准确率。", severity: "CRITICAL",
    patterns: ["保证准确", "准确率 100%", "百分百准确"],
    suggestion: "改为：基于回验的有效率趋势。" },
  { id: "NO_MEDICAL_LEGAL_FINANCE", description: "不要给医疗/法律/金融绝对建议。", severity: "CRITICAL",
    patterns: ["确诊", "治愈", "胜诉", "保证收益", "稳赚", "包过", "投资必赚"],
    suggestion: "改为：请咨询专业人士。" },
  { id: "NO_OVER_MYSTIFICATION", description: "避免过度神秘化。", severity: "MEDIUM",
    patterns: ["天命", "神谕", "玄学秘术"],
    suggestion: "改为：结构倾向 / 时间窗口。" },
  { id: "NO_JARGON_FOR_BEGINNER", description: "对普通用户避免过多术语。", severity: "MEDIUM",
    patterns: ["风域奇点", "终端收束", "母体数列", "回验权重"],
    suggestion: "改为：变化核心 / 末段 / 你的结构 / 记录权重。" },
  { id: "NO_FATE_FOR_ENTERPRISE", description: "企业文案不可命运化。", severity: "HIGH",
    patterns: ["命运", "算命", "玄学", "天定"],
    suggestion: "改为：Decision OS / Signal / Risk Window。" },
  { id: "DEMO_NOT_REAL", description: "Demo 文案不可误导成真实用户结果。", severity: "HIGH",
    patterns: ["你的真实结果是", "这是你的命运"],
    suggestion: "明示：这是示例 / Demo，不代表你本人。" },
  { id: "FULL60_PRIVACY", description: "Full 60 文案必须含隐私说明。", severity: "HIGH",
    patterns: [],
    suggestion: "需包含「请在私密环境使用」。" },
  { id: "NO_AD_FEELING", description: "小红书文案不能广告感过强。", severity: "MEDIUM",
    patterns: ["立即购买", "限时秒杀", "扫码下单", "马上抢"],
    suggestion: "改为：可收藏后慢慢看 / 评论区聊聊。" },
  { id: "NO_UNIVERSE_CREATION", description: "不要把个人世界生成写成真实宇宙创造。", severity: "HIGH",
    patterns: ["创造了真实宇宙", "真实世界被创造"],
    suggestion: "改为：象征性个人世界模型。" },
];

export const COPY_REPLACEMENTS: Array<{ from: string; to: string }> = [
  { from: "预测", to: "判断 / 趋势 / 信号" },
  { from: "命运", to: "时间窗口 / 个人路径 / 结构倾向" },
  { from: "定数", to: "这件事定没定 / 当前状态" },
  { from: "回验", to: "记录结果" },
  { from: "Full 60", to: "深度个人模型" },
  { from: "风域奇点", to: "变化核心 / 终端收束" },
];

export interface CopySafetyScanResult {
  ok: boolean;
  hits: { rule: CopySafetyRule; matched: string }[];
  needsSafetyNote: boolean;
}

export function scanCopySafety(text: string, opts?: { needsSafetyNote?: boolean }): CopySafetyScanResult {
  const hits: { rule: CopySafetyRule; matched: string }[] = [];
  for (const rule of COPY_SAFETY_RULES) {
    for (const p of rule.patterns) {
      if (p && text.includes(p)) {
        hits.push({ rule, matched: p });
        break;
      }
    }
  }
  return {
    ok: hits.filter(h => h.rule.severity !== "MEDIUM").length === 0,
    hits,
    needsSafetyNote: !!opts?.needsSafetyNote,
  };
}
