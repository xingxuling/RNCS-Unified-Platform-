// 联网 → Sequence Memory 桥接（预留）：高价值资料压缩为 SMU 草案
import type { NetworkSource } from "./aetherNetworkTypes";

export interface MemoryCompressionDraft {
  ofType: "NETWORK_SMU";
  title: string;
  text: string;
  trustScore: number;
  sourceUrl: string;
}

export function buildMemoryDraft(src: NetworkSource): MemoryCompressionDraft | undefined {
  if (src.trustScore < 0.6) return undefined;
  const text = (src.extractedText ?? "").slice(0, 2000);
  if (!text) return undefined;
  return { ofType: "NETWORK_SMU", title: src.title ?? src.url, text, trustScore: src.trustScore, sourceUrl: src.url };
}
