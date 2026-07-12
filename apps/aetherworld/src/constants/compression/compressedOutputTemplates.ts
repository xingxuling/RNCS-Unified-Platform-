export type CompressedOutputTemplateId =
  | "DECISION_OUTPUT"
  | "CREATION_OUTPUT"
  | "TERMINAL_OUTPUT"
  | "QA_OUTPUT"
  | "KNOWLEDGE_OUTPUT"
  | "NARRATIVE_OUTPUT"
  | "VOCAL_OUTPUT"
  | "TRANSLATION_OUTPUT"
  | "CURRENCY_OUTPUT"
  | "ERROR_OUTPUT";

export interface CompressedOutputTemplate {
  id: CompressedOutputTemplateId;
  label: string;
  en: string;
  defaultTitle: string;
  conclusionHint: string;
  reasonHint: string;
  actionHint: string;
  validationHint: string;
  riskHint: string;
}

export const COMPRESSED_OUTPUT_TEMPLATES: CompressedOutputTemplate[] = [
  { id: "DECISION_OUTPUT",    label: "决策输出",       en: "Decision",     defaultTitle: "结构化建议",     conclusionHint: "倾向结论", reasonHint: "主要原因", actionHint: "下一步",   validationHint: "如何验证", riskHint: "需提醒的风险" },
  { id: "CREATION_OUTPUT",    label: "创造物输出",     en: "Creation",     defaultTitle: "创作草案",       conclusionHint: "创作方向", reasonHint: "结构依据", actionHint: "下一步",   validationHint: "验证点",   riskHint: "边界提醒" },
  { id: "TERMINAL_OUTPUT",    label: "终端输出",       en: "Terminal",     defaultTitle: "终端结果",       conclusionHint: "执行结论", reasonHint: "原因",     actionHint: "推荐命令", validationHint: "回验命令", riskHint: "权限提醒" },
  { id: "QA_OUTPUT",          label: "QA 输出",        en: "QA",           defaultTitle: "质量摘要",       conclusionHint: "是否可发布", reasonHint: "主要问题", actionHint: "先修什么", validationHint: "重测项",   riskHint: "阻断项" },
  { id: "KNOWLEDGE_OUTPUT",   label: "知识输出",       en: "Knowledge",    defaultTitle: "知识摘要",       conclusionHint: "答案",     reasonHint: "依据",     actionHint: "下一步",   validationHint: "来源",     riskHint: "可信度" },
  { id: "NARRATIVE_OUTPUT",   label: "剧情输出",       en: "Narrative",    defaultTitle: "剧情草案",       conclusionHint: "主旨",     reasonHint: "冲突",     actionHint: "下一稿",   validationHint: "连续性",   riskHint: "敏感内容" },
  { id: "VOCAL_OUTPUT",       label: "声乐输出",       en: "Vocal",        defaultTitle: "Prompt 草案",    conclusionHint: "Prompt",   reasonHint: "声线",     actionHint: "试唱建议", validationHint: "音域",     riskHint: "嗓音保护" },
  { id: "TRANSLATION_OUTPUT", label: "翻译输出",       en: "Translation",  defaultTitle: "翻译结果",       conclusionHint: "译文",     reasonHint: "术语",     actionHint: "校对",     validationHint: "一致性",   riskHint: "歧义" },
  { id: "CURRENCY_OUTPUT",    label: "价值输出",       en: "Currency",     defaultTitle: "价值结果",       conclusionHint: "本次价值", reasonHint: "计算",     actionHint: "下一步",   validationHint: "对账",     riskHint: "非金融" },
  { id: "ERROR_OUTPUT",       label: "错误 / 权限",     en: "Error",        defaultTitle: "无法完成",       conclusionHint: "结论",     reasonHint: "原因",     actionHint: "替代方案", validationHint: "重试条件", riskHint: "权限说明" },
];

export function getTemplate(id: CompressedOutputTemplateId): CompressedOutputTemplate {
  return COMPRESSED_OUTPUT_TEMPLATES.find(t => t.id === id) ?? COMPRESSED_OUTPUT_TEMPLATES[0];
}
