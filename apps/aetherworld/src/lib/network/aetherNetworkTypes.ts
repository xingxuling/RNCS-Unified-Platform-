// Aether Network Runtime · 受控联网数据结构 v0.1

export type NetworkSourceType =
  | "WEB_PAGE"
  | "GITHUB_REPO"
  | "GITHUB_README"
  | "OFFICIAL_DOCS"
  | "API_DOCS"
  | "MODEL_CARD"
  | "BLOG"
  | "NEWS"
  | "UNKNOWN";

export type NetworkSafetyStatus = "PASS" | "WARN" | "BLOCK";

export interface NetworkSource {
  id: string;
  sourceType: NetworkSourceType;
  url: string;
  title?: string;
  domain?: string;
  extractedText?: string;
  summary?: string;
  fetchedAt: string;
  trustScore: number; // 0–1
  safetyStatus: NetworkSafetyStatus;
  /** 关联的开源架构分析 ID（如已转交） */
  relatedAnalysisId?: string;
  /** 来源备注（人工 / fetch / 粘贴） */
  origin?: "FETCH" | "MANUAL_PASTE" | "MIRROR";
  notes?: string[];
}

export type NetworkReadPurpose =
  | "OPEN_ARCHITECTURE_ABSORPTION"
  | "RESEARCH"
  | "VERIFICATION"
  | "MODEL_PROVIDER_CHECK"
  | "DOCS_LOOKUP"
  | "STORE_DISCOVERY"
  | "PREDICTION_CONTEXT"
  | "CUSTOM";

export interface NetworkReadRequest {
  id: string;
  url?: string;
  query?: string;
  purpose: NetworkReadPurpose;
  requiresUserConfirmation: boolean;
  createdAt: string;
}

export const NETWORK_SOURCE_TYPE_LABEL: Record<NetworkSourceType, string> = {
  WEB_PAGE: "公开网页",
  GITHUB_REPO: "GitHub 仓库",
  GITHUB_README: "GitHub README",
  OFFICIAL_DOCS: "官方文档",
  API_DOCS: "API 文档",
  MODEL_CARD: "模型卡片",
  BLOG: "技术博客",
  NEWS: "新闻",
  UNKNOWN: "未知来源",
};

export const NETWORK_PURPOSE_LABEL: Record<NetworkReadPurpose, string> = {
  OPEN_ARCHITECTURE_ABSORPTION: "开源架构吸收",
  RESEARCH: "调研",
  VERIFICATION: "事实回验",
  MODEL_PROVIDER_CHECK: "模型 Provider 检查",
  DOCS_LOOKUP: "文档查阅",
  STORE_DISCOVERY: "Store 发现",
  PREDICTION_CONTEXT: "预测上下文",
  CUSTOM: "自定义",
};

let __nid = 0;
export function nextNetworkId(prefix: "NS" | "NRQ"): string {
  __nid += 1;
  return `${prefix}-${Date.now().toString(36)}-${__nid.toString(36)}`;
}
