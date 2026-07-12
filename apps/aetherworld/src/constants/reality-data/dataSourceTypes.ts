export type DataSourceType =
  | "USER_PROVIDED" | "PUBLIC_WEB" | "OFFICIAL_STATISTICS" | "MARKET_DATA"
  | "RANKING_DATA" | "ACADEMIC_DATA" | "PRODUCT_USAGE_DATA" | "VALIDATION_DATA"
  | "PERSONAL_LOCAL_DATA" | "API_STRUCTURED_DATA" | "FICTIONAL_WORLD_DATA" | "DEMO_DATA";

export interface DataSourceTypeMeta {
  id: DataSourceType;
  label: string;
  en: string;
  description: string;
  canBeRealEvidence: boolean;
}

export const DATA_SOURCE_TYPES: DataSourceTypeMeta[] = [
  { id: "USER_PROVIDED",       label: "用户提供",     en: "User Provided",       description: "用户手动输入或粘贴。",           canBeRealEvidence: true },
  { id: "PUBLIC_WEB",          label: "公开网页",     en: "Public Web",          description: "公开新闻、网页、官网。",         canBeRealEvidence: true },
  { id: "OFFICIAL_STATISTICS", label: "官方统计",     en: "Official Statistics", description: "政府或权威机构统计。",           canBeRealEvidence: true },
  { id: "MARKET_DATA",         label: "市场数据",     en: "Market Data",         description: "价格、指数、交易。",             canBeRealEvidence: true },
  { id: "RANKING_DATA",        label: "榜单数据",     en: "Ranking Data",        description: "排行榜与年度榜单。",             canBeRealEvidence: true },
  { id: "ACADEMIC_DATA",       label: "学术数据",     en: "Academic Data",       description: "论文、引用、技术报告。",         canBeRealEvidence: true },
  { id: "PRODUCT_USAGE_DATA",  label: "产品使用",     en: "Product Usage",       description: "产品行为指标。",                 canBeRealEvidence: true },
  { id: "VALIDATION_DATA",     label: "回验数据",     en: "Validation Data",     description: "命中/未命中等回验记录。",        canBeRealEvidence: true },
  { id: "PERSONAL_LOCAL_DATA", label: "本地个人数据", en: "Local Personal",      description: "用户本地私有，需授权。",         canBeRealEvidence: true },
  { id: "API_STRUCTURED_DATA", label: "结构化 API",   en: "Structured API",      description: "API 拉取的结构化数据。",         canBeRealEvidence: true },
  { id: "FICTIONAL_WORLD_DATA",label: "虚构世界",     en: "Fictional World",     description: "虚拟世界数据，不能作为现实证据。", canBeRealEvidence: false },
  { id: "DEMO_DATA",           label: "演示数据",     en: "Demo Data",           description: "演示用，不能作为 Real 证据。",   canBeRealEvidence: false },
];
