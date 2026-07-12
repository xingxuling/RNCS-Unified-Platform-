// 社交发布前的敏感字段闸
import { scanForSecrets } from "./secretGuard";

export interface SocialSecretFilterResult {
  safe: boolean;
  level: "PASS" | "WARN" | "BLOCK";
  hits: { label: string; sample: string; confidence: "HIGH" | "MEDIUM" }[];
  reason?: string;
}

export function filterSocialContentForPublish(text: string): SocialSecretFilterResult {
  const report = scanForSecrets(text);
  return {
    safe: report.level !== "BLOCK",
    level: report.level,
    hits: report.hits.map((h) => ({ label: h.label, sample: h.sample, confidence: h.confidence })),
    reason: report.level === "BLOCK" ? "内容包含高置信密钥 / Token，已阻断公开发布。" : undefined,
  };
}
