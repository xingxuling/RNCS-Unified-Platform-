// Aether Capability Asset Market · 核心类型
// 内部能力 × 外部能力 × 用户能力 三类资产源
// 本轮不真正接支付、不真正公开上架、不自动安装高风险能力。

export type CapabilitySourceType =
  | "INTERNAL_CAPABILITY"
  | "EXTERNAL_CAPABILITY"
  | "USER_CAPABILITY";

export const CAPABILITY_SOURCE_LABEL: Record<CapabilitySourceType, string> = {
  INTERNAL_CAPABILITY: "内部能力",
  EXTERNAL_CAPABILITY: "外部能力",
  USER_CAPABILITY: "用户能力",
};

export type CapabilityPackageType =
  | "APP"
  | "ENGINE"
  | "CALCULUS"
  | "AGENT"
  | "PROMPT"
  | "DATASET"
  | "WORKFLOW"
  | "COMPONENT"
  | "MODEL"
  | "TEMPLATE"
  | "CONNECTOR"
  | "API_WRAPPER"
  | "OPEN_SOURCE_ADAPTER"
  | "WORLD_PACKAGE"
  | "CHARACTER_PACKAGE"
  | "MUSIC_PACKAGE"
  | "TRAINING_TOOL"
  | "ENTERPRISE_MODULE"
  | "USER_CREATION"
  | "EXTERNAL_TOOL"
  | "DATA_SOURCE"
  | "METHOD_PACKAGE";

export const CAPABILITY_PACKAGE_LABEL: Record<CapabilityPackageType, string> = {
  APP: "应用",
  ENGINE: "引擎",
  CALCULUS: "计算法",
  AGENT: "智能体",
  PROMPT: "Prompt 包",
  DATASET: "数据集",
  WORKFLOW: "工作流",
  COMPONENT: "组件",
  MODEL: "模型",
  TEMPLATE: "模板",
  CONNECTOR: "连接器",
  API_WRAPPER: "API 包装",
  OPEN_SOURCE_ADAPTER: "开源适配器",
  WORLD_PACKAGE: "世界包",
  CHARACTER_PACKAGE: "角色包",
  MUSIC_PACKAGE: "音乐包",
  TRAINING_TOOL: "训练工具",
  ENTERPRISE_MODULE: "企业模块",
  USER_CREATION: "用户创造",
  EXTERNAL_TOOL: "外部工具",
  DATA_SOURCE: "数据源",
  METHOD_PACKAGE: "方法包",
};

export type CreatorType =
  | "AETHERWORLD_OFFICIAL"
  | "USER"
  | "EXTERNAL_AUTHOR"
  | "IMPORTED"
  | "UNKNOWN";

export const CREATOR_LABEL: Record<CreatorType, string> = {
  AETHERWORLD_OFFICIAL: "Aetherworld 官方",
  USER: "用户",
  EXTERNAL_AUTHOR: "外部作者",
  IMPORTED: "导入",
  UNKNOWN: "未知",
};

export type CapabilityOrigin =
  | "AETHERWORLD_INTERNAL"
  | "USER_CREATED"
  | "OPEN_ARCHITECTURE_ABSORPTION"
  | "PROJECT_FUSION"
  | "NETWORK_RUNTIME"
  | "MANUAL_IMPORT"
  | "STORE_SUBMISSION";

export const CAPABILITY_ORIGIN_LABEL: Record<CapabilityOrigin, string> = {
  AETHERWORLD_INTERNAL: "Aetherworld 内部",
  USER_CREATED: "用户创造",
  OPEN_ARCHITECTURE_ABSORPTION: "开源架构吸收",
  PROJECT_FUSION: "项目融合",
  NETWORK_RUNTIME: "联网运行时",
  MANUAL_IMPORT: "手工导入",
  STORE_SUBMISSION: "商店提交",
};

export type CapabilityInstallMode =
  | "ONE_CLICK"
  | "COPY_PROMPT"
  | "IMPORT_JSON"
  | "DOWNLOAD_FILE"
  | "LOCAL_ONLY"
  | "API_CONNECT"
  | "MODEL_PROVIDER"
  | "ENTERPRISE_CONTACT"
  | "REFERENCE_ONLY";

export const CAPABILITY_INSTALL_LABEL: Record<CapabilityInstallMode, string> = {
  ONE_CLICK: "一键安装",
  COPY_PROMPT: "复制 Prompt",
  IMPORT_JSON: "导入 JSON",
  DOWNLOAD_FILE: "下载文件",
  LOCAL_ONLY: "仅本地使用",
  API_CONNECT: "API 接入",
  MODEL_PROVIDER: "模型 Provider 接入",
  ENTERPRISE_CONTACT: "企业联络",
  REFERENCE_ONLY: "仅供参考",
};

export type CapabilityRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export const CAPABILITY_RISK_LABEL: Record<CapabilityRiskLevel, string> = {
  LOW: "低风险",
  MEDIUM: "中风险",
  HIGH: "高风险",
  CRITICAL: "极高风险",
};

export type CapabilitySafetyStatus = "PASS" | "WARN" | "BLOCK" | "NEEDS_REVIEW";

export const CAPABILITY_SAFETY_LABEL: Record<CapabilitySafetyStatus, string> = {
  PASS: "通过",
  WARN: "提示",
  BLOCK: "阻断",
  NEEDS_REVIEW: "需要审核",
};

export type CapabilityOwnershipStatus =
  | "OWNED"
  | "USER_DECLARED"
  | "OPEN_SOURCE"
  | "LICENSE_UNKNOWN"
  | "RESTRICTED"
  | "PRIVATE";

export const CAPABILITY_OWNERSHIP_LABEL: Record<CapabilityOwnershipStatus, string> = {
  OWNED: "自有",
  USER_DECLARED: "用户声明",
  OPEN_SOURCE: "开源",
  LICENSE_UNKNOWN: "授权未知",
  RESTRICTED: "受限",
  PRIVATE: "私密",
};

export type CapabilityMonetization =
  | "FREE"
  | "PAID"
  | "SUBSCRIPTION"
  | "ENTERPRISE"
  | "PRIVATE"
  | "NOT_FOR_SALE"
  | "UNKNOWN";

export const CAPABILITY_MONETIZATION_LABEL: Record<CapabilityMonetization, string> = {
  FREE: "免费",
  PAID: "付费",
  SUBSCRIPTION: "订阅",
  ENTERPRISE: "企业",
  PRIVATE: "私享",
  NOT_FOR_SALE: "不售卖",
  UNKNOWN: "未确定",
};

export type CapabilityAssetStatus =
  | "DRAFT"
  | "READY"
  | "UNDER_REVIEW"
  | "PUBLISHED_PRIVATE"
  | "PUBLISHED_PUBLIC"
  | "BLOCKED"
  | "ARCHIVED";

export const CAPABILITY_ASSET_STATUS_LABEL: Record<CapabilityAssetStatus, string> = {
  DRAFT: "草案",
  READY: "就绪",
  UNDER_REVIEW: "待审核",
  PUBLISHED_PRIVATE: "已发布（私有）",
  PUBLISHED_PUBLIC: "已发布（公开）",
  BLOCKED: "已阻断",
  ARCHIVED: "已归档",
};

export interface CapabilityAssetPackage {
  id: string;
  name: string;
  cnName: string;

  sourceType: CapabilitySourceType;
  packageType: CapabilityPackageType;

  description: string;
  version: string;

  creatorType: CreatorType;
  creatorName?: string;

  origin: CapabilityOrigin;

  installMode: CapabilityInstallMode;

  requiredSystems: string[];
  exposedCapabilities: string[];

  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;

  permissions: string[];
  riskLevel: CapabilityRiskLevel;
  safetyStatus: CapabilitySafetyStatus;
  ownershipStatus: CapabilityOwnershipStatus;
  monetization: CapabilityMonetization;
  assetStatus: CapabilityAssetStatus;

  exportable: boolean;
  installable: boolean;
  sellable: boolean;
  userPublishable: boolean;

  createdAt: string;
}

export interface CapabilityAssetManifest {
  packageId: string;
  sourceType: CapabilitySourceType;
  packageType: CapabilityPackageType;
  version: string;
  requiredSystems: string[];
  permissions: string[];
  installMode: CapabilityInstallMode;
  safetyPolicy: string[];
  ownershipNote: string;
  licenseNote: string;
  usageGuide: string;
  limitations: string[];
}

export interface CapabilityAssetCandidate {
  id: string;
  sourceType: CapabilitySourceType;
  sourceRef: string;
  candidateType: CapabilityPackageType;
  title: string;
  cnTitle: string;
  valueReason: string;

  suggestedPackageType: CapabilityPackageType;
  suggestedInstallMode: CapabilityInstallMode;
  suggestedMonetization: CapabilityMonetization;

  riskLevel: CapabilityRiskLevel;
  safetyStatus: CapabilitySafetyStatus;
  ownershipStatus: CapabilityOwnershipStatus;

  shouldAssetizeNow: boolean;
  shouldRequireReview: boolean;
  notes: string;
}

export interface CapabilityAssetScanReport {
  scannedAt: string;
  internal: CapabilityAssetCandidate[];
  external: CapabilityAssetCandidate[];
  user: CapabilityAssetCandidate[];
  totals: {
    internal: number;
    external: number;
    user: number;
    sellable: number;
    needsReview: number;
    blocked: number;
  };
}
