/**
 * Lovable Native Integration Layer — Registry 类型定义
 *
 * 把 Lovable 提供的原生能力（Cloud / AI / Build URL / GitHub Sync / MCP / Connectors /
 * SEO 检查 / 自定义域名 等）统一登记成 Aetherworld 可枚举、可检测、可调用的「能力条目」。
 *
 * 注意：本层只做「抽象 + 检测 + 入口跳转」，不让 Aetherworld 业务逻辑直接耦合 Lovable。
 */

export type LovableCapabilityId =
  | "LOVABLE_CLOUD"
  | "LOVABLE_AI"
  | "LOVABLE_BUILD_URL"
  | "LOVABLE_GITHUB_SYNC"
  | "LOVABLE_MCP"
  | "LOVABLE_CONNECTORS"
  | "LOVABLE_STRIPE"
  | "LOVABLE_RESEND"
  | "LOVABLE_GOOGLE_MAPS"
  | "LOVABLE_GEMINI_ENTERPRISE"
  | "LOVABLE_SEO_AEO"
  | "LOVABLE_CUSTOM_DOMAIN"
  | "LOVABLE_MOBILE_WORKFLOW";

export type LovableCapabilityStatus =
  | "AVAILABLE"     // 平台支持，可立即接入
  | "ENABLED"       // 已在本项目启用
  | "PARTIAL"       // 部分可用 / 需配置
  | "NOT_CONFIGURED"
  | "UNAVAILABLE";

export type LovableRecommendation =
  | "RECOMMEND_NOW"   // 当前推荐接入
  | "RECOMMEND_LATER" // 建议晚些接入
  | "OPTIONAL"        // 看需要
  | "NOT_RECOMMENDED";

export interface LovableCapabilityEntry {
  capabilityId: LovableCapabilityId;
  chineseName: string;
  enLabel: string;
  /** 一句话用途 */
  purpose: string;
  /** 适合接入 Aetherworld 的模块 */
  fitFor: string[];
  status: LovableCapabilityStatus;
  recommendation: LovableRecommendation;
  /** 配置入口（Aetherworld 内部路径或外部 URL） */
  configEntry?: string;
  /** 风险 / 注意事项 */
  risks: string[];
}
