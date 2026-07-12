import type { DataSourceType } from "@/constants/reality-data/dataSourceTypes";
import type { DataCredibilityLevel } from "@/constants/reality-data/dataCredibilityLevels";
import type { DataFreshnessLevel } from "@/constants/reality-data/dataFreshnessLevels";

export type DataAccessMethod = "MANUAL" | "WEB" | "API" | "LOCAL" | "INTERNAL";
export type DataPrivacyLevel = "PUBLIC" | "USER_PRIVATE" | "FOUNDER_PRIVATE" | "SYSTEM_ONLY";

export interface ExternalDataSource {
  sourceId: string;
  sourceName: string;
  sourceType: DataSourceType;
  url?: string;
  provider?: string;
  accessMethod: DataAccessMethod;
  credibilityLevel: DataCredibilityLevel;
  freshnessRequirement: "LOW" | "MEDIUM" | "HIGH" | "REAL_TIME";
  freshnessLevel?: DataFreshnessLevel;
  allowedUseCases: string[];
  forbiddenUseCases: string[];
  privacyLevel: DataPrivacyLevel;
  lastCheckedAt?: string;
  dataDate?: string;
  notes: string[];
}

const REGISTRY: ExternalDataSource[] = [
  { sourceId: "user-manual",         sourceName: "用户手动输入",       sourceType: "USER_PROVIDED",       accessMethod: "MANUAL",  credibilityLevel: "MEDIUM",  freshnessRequirement: "MEDIUM", allowedUseCases: ["调研", "校准", "案例"], forbiddenUseCases: ["医疗诊断", "金融建议"], privacyLevel: "USER_PRIVATE", notes: ["用户提供的资料，需核对原始来源。"] },
  { sourceId: "official-stats",      sourceName: "官方统计",           sourceType: "OFFICIAL_STATISTICS", accessMethod: "WEB",     credibilityLevel: "OFFICIAL", freshnessRequirement: "MEDIUM", allowedUseCases: ["宏观分析", "政策", "教育"], forbiddenUseCases: [], privacyLevel: "PUBLIC", notes: ["以官方发布日期为准。"] },
  { sourceId: "ranking-source",      sourceName: "权威榜单",           sourceType: "RANKING_DATA",        accessMethod: "WEB",     credibilityLevel: "HIGH",     freshnessRequirement: "MEDIUM", allowedUseCases: ["排名分析", "对比"], forbiddenUseCases: ["绝对断言"], privacyLevel: "PUBLIC", notes: ["榜单方法论需说明。"] },
  { sourceId: "news-source",         sourceName: "新闻来源",           sourceType: "PUBLIC_WEB",          accessMethod: "WEB",     credibilityLevel: "MEDIUM",   freshnessRequirement: "HIGH",   allowedUseCases: ["事件背景"], forbiddenUseCases: ["医疗", "金融"], privacyLevel: "PUBLIC", notes: ["建议交叉验证。"] },
  { sourceId: "policy-source",       sourceName: "政策文件",           sourceType: "PUBLIC_WEB",          accessMethod: "WEB",     credibilityLevel: "OFFICIAL", freshnessRequirement: "MEDIUM", allowedUseCases: ["政策研究"], forbiddenUseCases: [], privacyLevel: "PUBLIC", notes: ["以发布版本号为准。"] },
  { sourceId: "market-source",       sourceName: "市场数据",           sourceType: "MARKET_DATA",         accessMethod: "API",     credibilityLevel: "HIGH",     freshnessRequirement: "REAL_TIME", allowedUseCases: ["价格", "趋势"], forbiddenUseCases: ["投资建议"], privacyLevel: "PUBLIC", notes: ["市场数据可能延迟。"] },
  { sourceId: "academic-source",     sourceName: "学术数据",           sourceType: "ACADEMIC_DATA",       accessMethod: "WEB",     credibilityLevel: "HIGH",     freshnessRequirement: "LOW",    allowedUseCases: ["研究"], forbiddenUseCases: [], privacyLevel: "PUBLIC", notes: ["注意领域新鲜度。"] },
  { sourceId: "product-usage",       sourceName: "产品使用数据",       sourceType: "PRODUCT_USAGE_DATA",  accessMethod: "INTERNAL",credibilityLevel: "HIGH",     freshnessRequirement: "HIGH",   allowedUseCases: ["产品优化"], forbiddenUseCases: ["对外公开个体数据"], privacyLevel: "SYSTEM_ONLY", notes: ["聚合后使用。"] },
  { sourceId: "validation-feedback", sourceName: "回验反馈",           sourceType: "VALIDATION_DATA",     accessMethod: "INTERNAL",credibilityLevel: "HIGH",     freshnessRequirement: "MEDIUM", allowedUseCases: ["校准"], forbiddenUseCases: ["改写主体数列"], privacyLevel: "SYSTEM_ONLY", notes: ["不可改写 Full60。"] },
  { sourceId: "personal-local",      sourceName: "本地个人数据",       sourceType: "PERSONAL_LOCAL_DATA", accessMethod: "LOCAL",   credibilityLevel: "MEDIUM",   freshnessRequirement: "MEDIUM", allowedUseCases: ["个人决策"], forbiddenUseCases: ["上传公开"], privacyLevel: "USER_PRIVATE", notes: ["本地优先，需授权。"] },
  { sourceId: "fictional-world",     sourceName: "虚构世界数据",       sourceType: "FICTIONAL_WORLD_DATA",accessMethod: "INTERNAL",credibilityLevel: "UNKNOWN",  freshnessRequirement: "LOW",    allowedUseCases: ["剧情", "世界观"], forbiddenUseCases: ["现实证据"], privacyLevel: "PUBLIC", notes: ["不能作为现实证据。"] },
  { sourceId: "demo-data",           sourceName: "演示数据",           sourceType: "DEMO_DATA",           accessMethod: "INTERNAL",credibilityLevel: "UNKNOWN",  freshnessRequirement: "LOW",    allowedUseCases: ["演示"], forbiddenUseCases: ["Real 判断"], privacyLevel: "PUBLIC", notes: ["不能作为 Real 证据。"] },
];

export function listExternalDataSources(): ExternalDataSource[] { return [...REGISTRY]; }
export function getExternalDataSource(id: string): ExternalDataSource | undefined { return REGISTRY.find((s) => s.sourceId === id); }
export function registerExternalDataSource(source: ExternalDataSource): void {
  const idx = REGISTRY.findIndex((s) => s.sourceId === source.sourceId);
  if (idx >= 0) REGISTRY[idx] = source; else REGISTRY.push(source);
}
export function registrySummary() {
  return {
    total: REGISTRY.length,
    byType: REGISTRY.reduce<Record<string, number>>((acc, s) => { acc[s.sourceType] = (acc[s.sourceType] ?? 0) + 1; return acc; }, {}),
    byPrivacy: REGISTRY.reduce<Record<string, number>>((acc, s) => { acc[s.privacyLevel] = (acc[s.privacyLevel] ?? 0) + 1; return acc; }, {}),
  };
}
