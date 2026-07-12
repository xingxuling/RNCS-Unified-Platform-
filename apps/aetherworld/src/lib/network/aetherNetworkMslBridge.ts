// 联网 → MSL 桥接：生成 MSL::NETWORK_READ 帧草案
import type { NetworkSource } from "./aetherNetworkTypes";

export interface MslNetworkFrameDraft {
  type: "MSL::NETWORK_READ";
  status: "SUCCESS" | "WARN" | "BLOCKED";
  sourceType: string;
  trust: number;
  url: string;
  at: string;
}

export function buildMslNetworkFrame(src: NetworkSource): MslNetworkFrameDraft {
  return {
    type: "MSL::NETWORK_READ",
    status: src.safetyStatus === "BLOCK" ? "BLOCKED" : src.safetyStatus === "WARN" ? "WARN" : "SUCCESS",
    sourceType: src.sourceType,
    trust: src.trustScore,
    url: src.url,
    at: src.fetchedAt,
  };
}
