// 社交内容敏感扫描适配（外壳，复用 secret + safety + Founder/Full60 关键字）
import { runSocialSafetyCheck } from "./socialSafetyGuard";
import { filterSocialContentForPublish } from "@/lib/security/socialSecretFilter";

export interface SocialSensitiveScanResult {
  level: "PASS" | "WARN" | "BLOCK";
  reasons: string[];
}

export function scanSocialContent(text: string): SocialSensitiveScanResult {
  const safety = runSocialSafetyCheck(text);
  const secret = filterSocialContentForPublish(text);
  const reasons: string[] = [];
  let level: SocialSensitiveScanResult["level"] = "PASS";

  for (const r of safety.risks) {
    reasons.push(r.message);
    if (r.severity === "BLOCK") level = "BLOCK";
    else if (level !== "BLOCK") level = "WARN";
  }
  for (const h of secret.hits) {
    reasons.push(`${h.label}（示例：${h.sample}）`);
    if (h.confidence === "HIGH") level = "BLOCK";
    else if (level !== "BLOCK") level = "WARN";
  }
  return { level, reasons };
}
