// 联网 → Record Center 桥接（薄封装；runtime.bridgeAll 默认调用，此处供单独使用）
import type { NetworkSource } from "./aetherNetworkTypes";

export async function recordNetworkRead(src: NetworkSource) {
  try {
    const { recordEvent } = await import("@/lib/record-center/recordCenterRuntime");
    return recordEvent({
      eventType: "SYSTEM_EVENT",
      sourceModule: "Network",
      title: `NETWORK_READ · ${src.domain ?? src.url}`,
      summary: src.summary ?? "",
      tags: [src.sourceType, `trust:${src.trustScore.toFixed(2)}`],
      status: src.safetyStatus === "BLOCK" ? "BLOCKED" : src.safetyStatus === "WARN" ? "WARN" : "RECORDED",
      relatedIds: { workspaceObjectId: src.id },
    });
  } catch { return undefined; }
}
