export type RealityDataMode =
  | "NO_EXTERNAL_DATA" | "USER_INPUT_ONLY" | "PUBLIC_DATA"
  | "STRUCTURED_API" | "LOCAL_PRIVATE_DATA" | "VALIDATION_FEEDBACK" | "MIXED_CALIBRATION";

export interface RealityDataModeMeta { id: RealityDataMode; label: string; en: string; description: string; }

export const REALITY_DATA_MODES: RealityDataModeMeta[] = [
  { id: "NO_EXTERNAL_DATA",    label: "不使用外部数据", en: "No External",         description: "纯创作、世界观、虚拟生活。" },
  { id: "USER_INPUT_ONLY",     label: "仅用户输入",     en: "User Input Only",     description: "只使用用户提供数据。" },
  { id: "PUBLIC_DATA",         label: "公开数据",       en: "Public Data",         description: "新闻、政策、榜单、行业。" },
  { id: "STRUCTURED_API",      label: "结构化 API",     en: "Structured API",      description: "结构化 API 数据。" },
  { id: "LOCAL_PRIVATE_DATA",  label: "本地私有",       en: "Local Private",       description: "本地私有数据，需授权。" },
  { id: "VALIDATION_FEEDBACK", label: "回验反馈",       en: "Validation Feedback", description: "用回验反馈校准。" },
  { id: "MIXED_CALIBRATION",   label: "混合校准",       en: "Mixed Calibration",   description: "主体数列+外部+回验。" },
];
