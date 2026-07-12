export interface SequenceAISafetyRule {
  id: string;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  match: (text: string) => boolean;
  suggestion: string;
}

const re = (p: RegExp) => (t: string) => p.test(t);

export const SEQUENCE_AI_SAFETY_RULES: SequenceAISafetyRule[] = [
  { id: "MEDICAL", description: "医疗诊断/治疗承诺", severity: "CRITICAL",
    match: re(/(确诊|诊断|治愈|根治|处方|药物剂量)/i),
    suggestion: "不提供医疗诊断，请咨询执业医生。" },
  { id: "LEGAL", description: "法律判决/承诺", severity: "HIGH",
    match: re(/(一定胜诉|包打赢|判决结果)/i),
    suggestion: "不提供法律判决预测，请咨询执业律师。" },
  { id: "FINANCE", description: "金融投资承诺", severity: "HIGH",
    match: re(/(稳赚|包赚|必涨|保本)/i),
    suggestion: "不预测金融收益，所有投资有风险。" },
  { id: "PSYCH", description: "心理诊断", severity: "HIGH",
    match: re(/(抑郁症|精神病|心理障碍)\s*诊断/i),
    suggestion: "不提供心理诊断，请联系专业心理咨询。" },
  { id: "REALITY_PROMISE", description: "宣称改变现实", severity: "CRITICAL",
    match: re(/(数列|MSL).{0,8}(改变现实|操控现实|决定命运)/i),
    suggestion: "数列与 MSL 是结构化建议工具，不直接改变现实。" },
  { id: "VIRTUAL_AS_REAL", description: "虚拟生活替代现实", severity: "HIGH",
    match: re(/(虚拟生活).{0,6}(替代|代替).{0,6}(现实|真实)/i),
    suggestion: "虚拟生活是模拟与日记草稿，不替代现实生活决定。" },
  { id: "FULL60_LEAK", description: "Full60 上传/泄露", severity: "CRITICAL",
    match: re(/(上传|分享|公开).{0,6}(Full\s*60|完整数列)/i),
    suggestion: "Full 60 默认仅本地，不要上传或公开。" },
  { id: "VOCAL_STRAIN", description: "硬顶高音", severity: "HIGH",
    match: re(/(硬顶|死撑).{0,6}(高音|嗓子)/i),
    suggestion: "声乐建议遵守安全边界，不鼓励硬顶高音。" },
];

export const SEQUENCE_AI_SAFETY_DISCLAIMER =
  "数列人工智能会根据当前主体模式、数列状态和系统引擎生成结构化建议与内容。它不会保证预测一定准确，不替代医疗、法律、金融、心理诊断或专业工程判断。Full 60 与真实主体数据默认仅本地使用，请谨慎保存和导出。";
