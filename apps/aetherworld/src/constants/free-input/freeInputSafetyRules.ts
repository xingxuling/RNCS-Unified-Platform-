export interface FreeInputSafetyRule {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  match: (text: string) => boolean;
  note: string;
}

const re = (p: RegExp) => (t: string) => p.test(t);

export const FREE_INPUT_SAFETY_RULES: FreeInputSafetyRule[] = [
  { id: "MEDICAL",        severity: "CRITICAL", description: "医疗诊断", match: re(/(确诊|治愈|根治|处方)/i), note: "不提供医疗诊断，请咨询执业医生。" },
  { id: "LEGAL",          severity: "HIGH",     description: "法律承诺", match: re(/(一定胜诉|包打赢)/i), note: "不提供法律预测，请咨询执业律师。" },
  { id: "FINANCE",        severity: "HIGH",     description: "金融承诺", match: re(/(稳赚|包赚|必涨|保本)/i), note: "不预测金融收益。" },
  { id: "PSYCH",          severity: "HIGH",     description: "心理诊断", match: re(/(抑郁症|精神病)\s*诊断/i), note: "不提供心理诊断。" },
  { id: "SELF_HARM",      severity: "CRITICAL", description: "自伤倾向", match: re(/(自杀|自残|自伤)/i), note: "请联系当地心理援助热线或可信赖的人。" },
  { id: "VIOLENCE",       severity: "CRITICAL", description: "暴力请求", match: re(/(伤害他人|报复.{0,4}方法)/i), note: "不生成伤害他人的内容。" },
  { id: "MINOR_RISK",     severity: "CRITICAL", description: "未成年人不当", match: re(/(未成年).{0,8}(性|暴露)/i), note: "不生成涉未成年人不当内容。" },
  { id: "REALITY_PROMISE",severity: "CRITICAL", description: "改变现实承诺", match: re(/(数列|MSL).{0,8}(改变现实|操控命运)/i), note: "数列/MSL 是结构化建议，不直接改变现实。" },
  { id: "FULL60_LEAK",    severity: "CRITICAL", description: "Full60 泄露", match: re(/(上传|公开).{0,6}(Full\s*60|完整数列)/i), note: "Full 60 默认仅本地。" },
  { id: "VOCAL_MED",      severity: "HIGH",     description: "声乐医学化", match: re(/(声带|嗓子).{0,6}(治疗|诊断)/i), note: "声乐建议不替代耳鼻喉医生。" },
  { id: "DANGEROUS_CODE", severity: "HIGH",     description: "危险代码", match: re(/(rm\s+-rf\s+\/|drop\s+database|format\s+c:)/i), note: "不生成可破坏系统的代码。" },
];
