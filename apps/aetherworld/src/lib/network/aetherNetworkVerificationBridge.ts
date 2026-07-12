// 联网 → 回验中心 桥接（v0.1 仅预留接口）
import type { NetworkSource } from "./aetherNetworkTypes";

export interface NetworkVerificationOutcome {
  claim: string;
  status: "PENDING" | "SUPPORTED" | "REFUTED" | "INSUFFICIENT";
  sources: NetworkSource[];
  reasons: string[];
}

/** v0.1 仅占位：接收声明 + 来源列表，返回 PENDING */
export function verifyClaimWithNetwork(claim: string, sources: NetworkSource[] = []): NetworkVerificationOutcome {
  return {
    claim,
    status: "PENDING",
    sources,
    reasons: ["v0.1 回验通道仅预留，多源校验将在 Verification Center 落地后实现"],
  };
}
