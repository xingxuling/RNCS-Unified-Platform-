// User Asset Upload · Chat 桥
import {
  USER_UPLOADED_ASSET_TYPE_LABEL,
  USER_ASSET_SAFETY_LABEL,
  USER_ASSET_OWNERSHIP_LABEL,
  USER_ASSET_MARKET_STATUS_LABEL,
  type UserUploadedAsset,
} from "./userAssetUploadTypes";
import { analyticsSummary, listUserAssets, listListings } from "./userAssetUploadRuntime";
import {
  USER_ASSET_SAFETY_ALLOWED,
  USER_ASSET_SAFETY_FORBIDDEN,
} from "./userAssetSafetyPolicy";

export type UserAssetChatFocus =
  | "OVERVIEW"
  | "UPLOAD_GUIDE"
  | "OWNERSHIP"
  | "LISTING_DRAFT"
  | "REVIEW"
  | "BLOCKED"
  | "SAFETY";

const FOCUS_LABEL: Record<UserAssetChatFocus, string> = {
  OVERVIEW: "上传资产总览",
  UPLOAD_GUIDE: "上传与售卖流程",
  OWNERSHIP: "所有权声明",
  LISTING_DRAFT: "商品草案",
  REVIEW: "待审核资产",
  BLOCKED: "被阻断资产",
  SAFETY: "上传安全边界",
};

const TRIGGER_KEYWORDS = [
  "上传文件", "上传资产", "出售文件", "卖文件", "我要上架", "我要出售",
  "user asset", "user upload", "上传 prompt", "上传模板", "上传数据集",
  "上传 zip", "上传压缩包", "私有上架", "上传出售", "上传商品",
  "我的上传", "我的资产", "我的商品",
];

export function detectUserAssetUploadIntent(raw: string): boolean {
  if (!raw) return false;
  const t = raw.toLowerCase();
  return TRIGGER_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}

function pickFocus(raw: string): UserAssetChatFocus {
  const t = raw.toLowerCase();
  if (/不能卖|禁止|不允许|secret|敏感|安全/.test(t)) return "SAFETY";
  if (/阻断|block|高危|被拒/.test(t)) return "BLOCKED";
  if (/审核|review|待审/.test(t)) return "REVIEW";
  if (/草案|商品|listing|上架|draft/.test(t)) return "LISTING_DRAFT";
  if (/所有权|版权|授权|原创|license/.test(t)) return "OWNERSHIP";
  if (/怎么上传|流程|步骤|how/.test(t)) return "UPLOAD_GUIDE";
  return "OVERVIEW";
}

export interface ChatUserAssetInfo {
  question: string;
  focus: UserAssetChatFocus;
  focusLabel: string;
  summary: string;
  totals: {
    total: number;
    drafts: number;
    privateCandidates: number;
    blocked: number;
    needsReview: number;
  };
  recentAssets: {
    id: string;
    fileName: string;
    typeLabel: string;
    safetyLabel: string;
    ownershipLabel: string;
    marketLabel: string;
    blockedReasons: string[];
  }[];
  safetyAllowed: string[];
  safetyForbidden: string[];
  workbenchHint: string;
}

function buildSummary(focus: UserAssetChatFocus): string {
  switch (focus) {
    case "UPLOAD_GUIDE":
      return "上传流程：选择文件或压缩包 → 自动识别类型与风险 → 声明所有权 → 生成商品草案 → 进入私有商店候选。不真实公开发布、不自动执行。";
    case "OWNERSHIP":
      return "所有权必须用户声明：原创 / 拥有分发权 / 开源公共许可 / 已获改编授权 / 仅私用。未声明的资产不允许进入商品草案。";
    case "LISTING_DRAFT":
      return "商品草案 = Title + 类型 + 价格建议 + 安装模式 + 安全 / 所有权说明，仅在本地生成，不写后端、不真实公开上架。";
    case "REVIEW":
      return "包含敏感关键词、ZIP、文件夹上传、所有权不明的资产默认进入 NEEDS_REVIEW，必须人工补全后才能进入私有上架候选。";
    case "BLOCKED":
      return "高危后缀（.env / .key / .pem / .exe / .sh / .sql 等）以及明文 secret / 私钥直接 BLOCK，不允许进入流程。";
    case "SAFETY":
      return "禁止：真实支付 / 真实公开上架 / 自动发布用户文件 / 自动解压执行 / 导出 secret / Full60 / Founder-only / 高危后缀。";
    case "OVERVIEW":
    default:
      return "Aether User Asset Upload Market：用户主动上传 Prompt / 模板 / 数据集 / 世界包 / 角色包 / Workflow / Agent / 训练包 / 企业文档 → 资产化为商品草案，仅在私有商店候选。";
  }
}

function projectAsset(a: UserUploadedAsset) {
  return {
    id: a.id,
    fileName: a.fileName,
    typeLabel: USER_UPLOADED_ASSET_TYPE_LABEL[a.detectedAssetType],
    safetyLabel: USER_ASSET_SAFETY_LABEL[a.safetyStatus],
    ownershipLabel: USER_ASSET_OWNERSHIP_LABEL[a.ownershipStatus],
    marketLabel: USER_ASSET_MARKET_STATUS_LABEL[a.marketStatus],
    blockedReasons: a.blockedReasons,
  };
}

export function buildChatUserAssetInfo(raw: string): ChatUserAssetInfo | undefined {
  if (!detectUserAssetUploadIntent(raw)) return undefined;
  const focus = pickFocus(raw);
  const stats = analyticsSummary();
  const all = listUserAssets();
  let highlighted: UserUploadedAsset[] = all.slice(0, 6);
  if (focus === "BLOCKED") highlighted = all.filter((a) => a.safetyStatus === "BLOCK").slice(0, 6);
  else if (focus === "REVIEW") highlighted = all.filter((a) => a.marketStatus === "NEEDS_REVIEW").slice(0, 6);
  else if (focus === "LISTING_DRAFT") highlighted = all.filter((a) => a.marketStatus === "PRIVATE_LISTING").slice(0, 6);

  const blocked = all.filter((a) => a.safetyStatus === "BLOCK").length;
  const needsReview = all.filter((a) => a.marketStatus === "NEEDS_REVIEW").length;

  return {
    question: raw,
    focus,
    focusLabel: FOCUS_LABEL[focus],
    summary: buildSummary(focus),
    totals: {
      total: stats.total,
      drafts: listListings().length,
      privateCandidates: stats.privateCandidates,
      blocked,
      needsReview,
    },
    recentAssets: highlighted.map(projectAsset),
    safetyAllowed: USER_ASSET_SAFETY_ALLOWED,
    safetyForbidden: USER_ASSET_SAFETY_FORBIDDEN,
    workbenchHint: "打开 /system/user-assets 完成上传 / 声明所有权 / 生成商品草案 / 进入私有商店候选（不真实公开上架、不真实支付）。",
  };
}
