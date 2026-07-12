// Capability Asset · Chat 桥
import {
  CAPABILITY_SOURCE_LABEL,
  CAPABILITY_PACKAGE_LABEL,
  CAPABILITY_RISK_LABEL,
  CAPABILITY_SAFETY_LABEL,
  CAPABILITY_INSTALL_LABEL,
  CAPABILITY_MONETIZATION_LABEL,
  type CapabilityAssetCandidate,
  type CapabilitySourceType,
} from "./capabilityAssetTypes";
import { runCapabilityAssetScan } from "./capabilityAssetRuntime";
import {
  CAPABILITY_ASSET_SAFETY_ALLOWED,
  CAPABILITY_ASSET_SAFETY_FORBIDDEN,
} from "./capabilityAssetSafetyPolicy";

export type CapabilityAssetChatFocus =
  | "OVERVIEW"
  | "INTERNAL"
  | "EXTERNAL"
  | "USER"
  | "DRAFT"
  | "MANIFEST"
  | "SELLABLE"
  | "REVIEW"
  | "SAFETY";

const FOCUS_LABEL: Record<CapabilityAssetChatFocus, string> = {
  OVERVIEW: "能力资产总览",
  INTERNAL: "内部能力候选",
  EXTERNAL: "外部能力候选",
  USER: "用户能力候选",
  DRAFT: "生成能力包草案",
  MANIFEST: "生成 Manifest",
  SELLABLE: "可售卖清单",
  REVIEW: "待审核清单",
  SAFETY: "安全边界",
};

const TRIGGER_KEYWORDS = [
  "能力资产", "能力商店", "capability asset", "asset market",
  "内部能力", "外部能力", "用户能力", "user creation", "external capability",
  "商店化", "资产化", "能力包", "package draft", "manifest",
  "做成训练工具包", "做成 connector", "做成 prompt 包", "做成 world package",
  "能力清单", "可出售", "可发布", "哪些不能出售",
  "store draft", "store package",
];

export function detectCapabilityAssetIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): CapabilityAssetChatFocus {
  const t = raw.toLowerCase();
  if (/不能出售|不能卖|不能发布|私密/.test(t)) return "SAFETY";
  if (/待审|审核|review/.test(t)) return "REVIEW";
  if (/可出售|可售|可卖|sellable/.test(t)) return "SELLABLE";
  if (/manifest|清单文件/.test(t)) return "MANIFEST";
  if (/做成.*包|做成.*草案|生成.*草案|package draft|store draft/.test(t)) return "DRAFT";
  if (/用户能力|user creation|用户创造/.test(t)) return "USER";
  if (/外部能力|external|github|api 包装|connector|开源/.test(t)) return "EXTERNAL";
  if (/内部能力|内部|aetherworld 能力|官方能力/.test(t)) return "INTERNAL";
  return "OVERVIEW";
}

export interface ChatCapabilityAssetInfo {
  question: string;
  focus: CapabilityAssetChatFocus;
  focusLabel: string;
  summary: string;
  totals: {
    internal: number;
    external: number;
    user: number;
    sellable: number;
    needsReview: number;
    blocked: number;
  };
  highlightedCandidates: {
    id: string;
    sourceType: CapabilitySourceType;
    sourceTypeLabel: string;
    title: string;
    cnTitle: string;
    packageType: string;
    packageTypeLabel: string;
    risk: string;
    riskLabel: string;
    safety: string;
    safetyLabel: string;
    installMode: string;
    installModeLabel: string;
    monetization: string;
    monetizationLabel: string;
    needsReview: boolean;
  }[];
  safetyAllowed: string[];
  safetyForbidden: string[];
  workbenchHint: string;
}

function buildSummary(focus: CapabilityAssetChatFocus): string {
  switch (focus) {
    case "INTERNAL":
      return "Aetherworld 内部能力已识别，包括引擎 / 计算法 / Prompt / 工作流 / 训练工具 / 企业模块。所有权清晰，可直接资产化。";
    case "EXTERNAL":
      return "外部能力（GitHub / API / Ollama / WebLLM / 第三方 SaaS）按 license + 数据外传 + 执行风险评级，HIGH/CRITICAL 仅参考或企业联络。";
    case "USER":
      return "用户能力（Prompt / App / Agent / Workflow / Dataset / 世界 / 角色 / 音乐 / 模板）必须用户确认后才能发布，包含 secret 永远不会被发布。";
    case "DRAFT":
      return "可在 /system/capability-assets 任选候选 → 一键生成 CapabilityAssetPackage 与 Manifest 草案，保存到 Workspace。";
    case "MANIFEST":
      return "Manifest 含 requiredSystems / permissions / installMode / licenseNote / 使用指引 / 限制条款。";
    case "SELLABLE":
      return "可售卖：仅 INTERNAL + 安全 PASS + license 清晰 + 安装模式非 REFERENCE_ONLY。USER 与受限外部均不可直接售卖。";
    case "REVIEW":
      return "高风险外部 / 未确认用户能力 / license 未知 全部进入 NEEDS_REVIEW，禁止一键安装、禁止售卖、禁止公开发布。";
    case "SAFETY":
      return "禁止：真实支付 / 真实公开上架 / 自动发布 / 导出 secret / 导出 Full60 / 导出 Founder-only / 打包未授权外部代码。";
    case "OVERVIEW":
    default:
      return "Aether Capability Asset Market：内部 × 外部 × 用户三类能力源统一资产化，本轮仅生成候选 / 包草案 / Manifest / 商店草稿，不真正接支付 / 不真正公开上架。";
  }
}

function projectCandidates(list: CapabilityAssetCandidate[], limit = 8) {
  return list.slice(0, limit).map((c) => ({
    id: c.id,
    sourceType: c.sourceType,
    sourceTypeLabel: CAPABILITY_SOURCE_LABEL[c.sourceType],
    title: c.title,
    cnTitle: c.cnTitle,
    packageType: c.suggestedPackageType,
    packageTypeLabel: CAPABILITY_PACKAGE_LABEL[c.suggestedPackageType],
    risk: c.riskLevel,
    riskLabel: CAPABILITY_RISK_LABEL[c.riskLevel],
    safety: c.safetyStatus,
    safetyLabel: CAPABILITY_SAFETY_LABEL[c.safetyStatus],
    installMode: c.suggestedInstallMode,
    installModeLabel: CAPABILITY_INSTALL_LABEL[c.suggestedInstallMode],
    monetization: c.suggestedMonetization,
    monetizationLabel: CAPABILITY_MONETIZATION_LABEL[c.suggestedMonetization],
    needsReview: c.shouldRequireReview,
  }));
}

export function buildChatCapabilityAssetInfo(raw: string): ChatCapabilityAssetInfo | undefined {
  if (!detectCapabilityAssetIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const report = runCapabilityAssetScan();
  let highlighted: CapabilityAssetCandidate[] = [];
  switch (focus) {
    case "INTERNAL": highlighted = report.internal; break;
    case "EXTERNAL": highlighted = report.external; break;
    case "USER": highlighted = report.user; break;
    case "SELLABLE": highlighted = [...report.internal, ...report.external].filter((c) => c.shouldAssetizeNow); break;
    case "REVIEW": highlighted = [...report.internal, ...report.external, ...report.user].filter((c) => c.shouldRequireReview); break;
    default: highlighted = [report.internal[0], report.external[0], report.user[0]].filter(Boolean) as CapabilityAssetCandidate[];
  }
  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: buildSummary(focus),
    totals: report.totals,
    highlightedCandidates: projectCandidates(highlighted),
    safetyAllowed: CAPABILITY_ASSET_SAFETY_ALLOWED,
    safetyForbidden: CAPABILITY_ASSET_SAFETY_FORBIDDEN,
    workbenchHint: "打开 /system/capability-assets 完成扫描 / 生成草案 / 生成 Manifest / 保存 Workspace（不真正接支付、不真正公开上架）。",
  };
}
