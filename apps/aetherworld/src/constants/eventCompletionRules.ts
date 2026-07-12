// 事件字段补全规则
export interface EventCompletionField {
  key: string;             // 对应 EventAlgorithm 上的字段（或扩展字段）
  label: string;
  required: boolean;
  weight: number;          // 缺失代价
  fallback?: string;       // 自动补齐建议（非强制写入）
}

export const EVENT_COMPLETION_FIELDS: EventCompletionField[] = [
  { key: "userFriendlyName",       label: "用户语言名称",  required: true,  weight: 3,  fallback: "使用事件 name 作为临时用户语言名称" },
  { key: "professionalName",       label: "专业名称",      required: false, weight: 1,  fallback: "可沿用英文 en 字段" },
  { key: "actionLanguage",         label: "行动语",        required: true,  weight: 2,  fallback: "由 actionPermissions 拼接生成" },
  { key: "microcopy",              label: "Microcopy",     required: false, weight: 1 },
  { key: "subtleManifestations",   label: "弱信号表现",    required: true,  weight: 2 },
  { key: "typicalManifestations",  label: "中等信号表现",  required: true,  weight: 2 },
  { key: "strongManifestations",   label: "强信号表现",    required: true,  weight: 2 },
  { key: "falseManifestations",    label: "假信号表现",    required: true,  weight: 3,  fallback: "至少补 1 条噪声/投射类伪信号" },
  { key: "validationSignals",      label: "回验指标",      required: true,  weight: 3 },
  { key: "riskSignals",            label: "风险信号",      required: false, weight: 1 },
  { key: "recommendedFeedbackFields", label: "推荐回验字段", required: true, weight: 2, fallback: "复用 feedbackMetrics" },
  { key: "polarity",               label: "极性",          required: true,  weight: 1 },
  { key: "relatedNumbers",         label: "关联数字",      required: false, weight: 1 },
  { key: "relatedFiveDomains",     label: "天地人神风映射", required: false, weight: 1 },
  { key: "relatedActionPermissions", label: "行动许可",    required: true,  weight: 2 },
];

export const TOTAL_COMPLETION_WEIGHT =
  EVENT_COMPLETION_FIELDS.reduce((s, f) => s + f.weight, 0);
