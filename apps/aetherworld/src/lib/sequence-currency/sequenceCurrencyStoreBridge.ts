// Store / WebXXM 能力包使用 → 数列货币系统计量桥。
// 本轮不做真实扣费 / 支付 / 交易，只做使用计量。
import { recordContribution } from "@/lib/currency/sequenceCurrencyEngine";
import { isFounderActive } from "@/lib/founderCalculus";

export interface StorePackageUsageInput {
  packageId: string;
  packageType?: string;
  sourceModule?: string;
  triggeredByChatMessageId?: string;
  producedObjectId?: string;
  qaStatus?: "PASS" | "WARN" | "BLOCK";
}

export function recordStorePackageUsageCurrencyEvent(input: StorePackageUsageInput) {
  const userMode = isFounderActive() ? "FOUNDER" : "LIGHT_20";
  const safetyScore = input.qaStatus === "BLOCK" ? 2 : input.qaStatus === "WARN" ? 5 : 8;
  try {
    return recordContribution({
      contributionType: "EXPORT_ASSET",
      userMode,
      qualityScore: 5,
      usefulnessScore: 6,
      validationScore: 5,
      complexityScore: 4,
      safetyScore,
      duplicationRisk: 0,
      description: `WebXXM 能力包使用：${input.packageId}${input.packageType ? " / " + input.packageType : ""}${
        input.sourceModule ? " · 来源 " + input.sourceModule : ""
      }`,
      sourceEngine: "WebXXMStore",
      sourceId: input.packageId,
    });
  } catch {
    return undefined;
  }
}
