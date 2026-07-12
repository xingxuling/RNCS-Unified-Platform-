// 常数宇宙 v1.0 · 常数分组目录
export type ConstantGroupId =
  | "NUMBER" | "FIVE_DOMAIN" | "OPERATOR" | "TIME_PHASE"
  | "EVENT"  | "FEEDBACK"    | "USER"     | "PLATFORM" | "PHYSICAL";

export interface ConstantGroupMeta {
  id: ConstantGroupId;
  name: string;
  userFriendlyName: string;
  description: string;
  consumers: string[];        // 哪些计算法读取
  founderEditable: boolean;
  riskOnChange: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export const CONSTANT_GROUPS: ConstantGroupMeta[] = [
  { id: "NUMBER",      name: "数字常数 0–9", userFriendlyName: "数字含义",  description: "0–9 的核心含义。",            consumers: ["RealSubjectCalculus","DeterminantNumberEngine","PredictionDetail","PromptForge"], founderEditable: true,  riskOnChange: "CRITICAL" },
  { id: "FIVE_DOMAIN", name: "五域常数",     userFriendlyName: "天地人神风", description: "五位数对应的五域定义。",     consumers: ["RealSubjectCalculus","DeterminantNumberEngine","EventEngine"], founderEditable: true,  riskOnChange: "CRITICAL" },
  { id: "OPERATOR",    name: "乘除算子",     userFriendlyName: "放大削弱",   description: "×1–10 / ÷1–10 算子。",        consumers: ["DeterminantNumberEngine","EventEngine"], founderEditable: true,  riskOnChange: "HIGH" },
  { id: "TIME_PHASE",  name: "十二长生相位", userFriendlyName: "时间相位",   description: "事件阶段的时间相位映射。",   consumers: ["TriggerCalendar","EventEngine"], founderEditable: true,  riskOnChange: "HIGH" },
  { id: "EVENT",       name: "事件常数",     userFriendlyName: "事件参数",   description: "15 维度事件的默认参数。",     consumers: ["EventEngine","PredictionDetail","FeedbackEngine"], founderEditable: true,  riskOnChange: "HIGH" },
  { id: "FEEDBACK",    name: "回验常数",     userFriendlyName: "回验权重",   description: "回验修正与样本折扣。",       consumers: ["FeedbackWeightEngine","Accuracy"], founderEditable: true,  riskOnChange: "CRITICAL" },
  { id: "USER",        name: "用户常数",     userFriendlyName: "用户类型",   description: "用户类型默认参数。",         consumers: ["UIFit","LanguageFit","Onboarding"], founderEditable: true,  riskOnChange: "MEDIUM" },
  { id: "PLATFORM",    name: "平台常数",     userFriendlyName: "平台参数",   description: "传播平台权重。",             consumers: ["XiaohongshuHeat","PromptForge"], founderEditable: true,  riskOnChange: "HIGH" },
  { id: "PHYSICAL",    name: "物理现实常数", userFriendlyName: "现实变量",   description: "Phase C 接口（多为占位）。", consumers: ["EventEngine (Phase C)"], founderEditable: true,  riskOnChange: "LOW" },
];
