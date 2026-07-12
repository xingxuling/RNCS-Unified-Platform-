// User Asset Upload · 安全扫描
import type { CapabilityRiskLevel } from "@/lib/capability-assets/capabilityAssetTypes";
import {
  USER_ASSET_BLOCKED_EXTENSIONS,
  USER_ASSET_ALLOWED_EXTENSIONS,
  USER_ASSET_LARGE_FILE_BYTES,
  BLOCKED_EXTENSION_REASON,
  getExtension,
} from "./userAssetSafetyPolicy";
import type { UserAssetSafetyStatus } from "./userAssetUploadTypes";

const SECRET_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/i, reason: "明文私钥" },
  { re: /sk-[a-zA-Z0-9]{20,}/, reason: "疑似 OpenAI / 通用 sk- 类 API Key" },
  { re: /xox[abprs]-[a-zA-Z0-9-]{10,}/, reason: "疑似 Slack Token" },
  { re: /AIza[0-9A-Za-z\-_]{30,}/, reason: "疑似 Google API Key" },
  { re: /AKIA[0-9A-Z]{16}/, reason: "疑似 AWS Access Key ID" },
  { re: /ghp_[A-Za-z0-9]{20,}/, reason: "疑似 GitHub Personal Token" },
  { re: /(?:api[_-]?key|apikey|secret|token|password)\s*[:=]\s*['"][^'"]{12,}['"]/i, reason: "硬编码密钥 / 密码" },
  { re: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, reason: "疑似 JWT" },
];

const SENSITIVE_TAGS: { re: RegExp; reason: string }[] = [
  { re: /Full60[:：\s]/, reason: "Full60 原文不可出售" },
  { re: /Founder[-_ ]?only/i, reason: "Founder-only 原文不可出售" },
  { re: /身份证号|手机号|银行卡号/, reason: "明显个人隐私字段" },
];

const MALICIOUS_PATTERNS: { re: RegExp; reason: string }[] = [
  { re: /rm\s+-rf\s+\/(?!\s*tmp)/, reason: "可疑破坏性 shell" },
  { re: /child_process|exec\s*\(/, reason: "可执行子进程调用" },
  { re: /eval\s*\(\s*atob\s*\(/, reason: "动态 eval(base64) 风险" },
];

export interface UserAssetSafetyResult {
  safetyStatus: UserAssetSafetyStatus;
  riskLevel: CapabilityRiskLevel;
  blockedReasons: string[];
  warningReasons: string[];
}

interface ScanInput {
  fileName: string;
  fileSizeBytes: number;
  preview?: string;
  innerFileNames?: string[];
  isZip?: boolean;
}

export function scanUserAsset(input: ScanInput): UserAssetSafetyResult {
  const blocked: string[] = [];
  const warnings: string[] = [];

  const ext = getExtension(input.fileName);
  if (ext && USER_ASSET_BLOCKED_EXTENSIONS.has(ext)) {
    blocked.push(`禁止后缀 .${ext}（${BLOCKED_EXTENSION_REASON[ext] ?? "高危类型"}）`);
  }
  if (ext && !USER_ASSET_ALLOWED_EXTENSIONS.has(ext) && !USER_ASSET_BLOCKED_EXTENSIONS.has(ext)) {
    warnings.push(`后缀 .${ext} 不在白名单内`);
  }

  if (input.fileSizeBytes > USER_ASSET_LARGE_FILE_BYTES) {
    warnings.push(`文件超过 ${(USER_ASSET_LARGE_FILE_BYTES / 1024 / 1024).toFixed(0)}MB，需人工复核`);
  }

  // 内部文件名扫描（针对 zip）
  if (input.innerFileNames && input.innerFileNames.length > 0) {
    for (const inner of input.innerFileNames) {
      const ie = getExtension(inner);
      if (ie && USER_ASSET_BLOCKED_EXTENSIONS.has(ie)) {
        blocked.push(`压缩包内含禁止文件：${inner}`);
      }
    }
  }

  // 文本内容扫描
  const text = input.preview ?? "";
  if (text) {
    for (const { re, reason } of SECRET_PATTERNS) {
      if (re.test(text)) blocked.push(reason);
    }
    for (const { re, reason } of SENSITIVE_TAGS) {
      if (re.test(text)) blocked.push(reason);
    }
    for (const { re, reason } of MALICIOUS_PATTERNS) {
      if (re.test(text)) blocked.push(reason);
    }
  }

  // zip 默认需要审核
  let needsReview = false;
  if (input.isZip) {
    warnings.push("压缩包默认进入人工审核，禁止自动解压执行");
    needsReview = true;
  }
  if (/dataset|jsonl|csv/i.test(input.fileName)) {
    warnings.push("数据集类资产默认需要复核来源与脱敏");
    needsReview = true;
  }
  if (/connector|api[_-]?key/i.test(input.fileName)) {
    warnings.push("API Connector 类资产需要复核外传风险");
    needsReview = true;
  }

  let safetyStatus: UserAssetSafetyStatus;
  let riskLevel: CapabilityRiskLevel;

  if (blocked.length > 0) {
    safetyStatus = "BLOCK";
    riskLevel = "CRITICAL";
  } else if (needsReview) {
    safetyStatus = "NEEDS_REVIEW";
    riskLevel = "HIGH";
  } else if (warnings.length > 0) {
    safetyStatus = "WARN";
    riskLevel = "MEDIUM";
  } else {
    safetyStatus = "PASS";
    riskLevel = "LOW";
  }

  return {
    safetyStatus,
    riskLevel,
    blockedReasons: blocked,
    warningReasons: warnings,
  };
}
