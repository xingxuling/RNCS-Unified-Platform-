export interface NarrativeSafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const NARRATIVE_SAFETY_RULES: NarrativeSafetyRule[] = [
  { id: "NO_DANGEROUS_ADVICE",    description: "禁止输出违法 / 危险现实行动建议",             severity: "CRITICAL" },
  { id: "NO_REAL_PERSON_ABUSE",   description: "涉及真实人物时不得做不当身份断言或侵犯隐私", severity: "CRITICAL" },
  { id: "VIRTUAL_NOT_REAL",       description: "虚拟生活不可写成现实替代",                   severity: "HIGH"     },
  { id: "NO_DEIFICATION",         description: "不把现实用户写成神明化绝对身份",             severity: "HIGH"     },
  { id: "NO_VIRAL_PROMISE",       description: "不承诺剧情一定爆火或平台必签约",             severity: "MEDIUM"   },
  { id: "PLATFORM_MISMATCH",      description: "声称适合某平台但缺平台适配",                 severity: "MEDIUM"   },
];

export const NARRATIVE_DISCLAIMER = [
  "剧情文本引擎用于创作辅助、剧情结构生成、角色对白、漫画脚本和游戏任务文本，不代表现实事实。",
  "涉及真实人物、现实关系、医疗、法律、金融、危险行动时，必须避免不当断言和危险建议。",
  "虚拟生活内容是创作与自我理解材料，不是现实替代品。",
];
