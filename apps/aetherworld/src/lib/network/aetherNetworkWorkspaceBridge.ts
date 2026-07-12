// 联网 → Workspace 桥接（v0.1 预留）：返回 Workspace 对象草案
import type { NetworkSource } from "./aetherNetworkTypes";

export interface WorkspaceNetworkObjectDraft {
  objectType: "NETWORK_SOURCE";
  title: string;
  payload: {
    url: string;
    title?: string;
    summary?: string;
    trustScore: number;
    fetchedAt: string;
    sourceType: string;
    relatedAnalysisId?: string;
    safetyStatus: string;
  };
}

export function buildWorkspaceDraft(src: NetworkSource): WorkspaceNetworkObjectDraft {
  return {
    objectType: "NETWORK_SOURCE",
    title: src.title ?? src.url,
    payload: {
      url: src.url,
      title: src.title,
      summary: src.summary,
      trustScore: src.trustScore,
      fetchedAt: src.fetchedAt,
      sourceType: src.sourceType,
      relatedAnalysisId: src.relatedAnalysisId,
      safetyStatus: src.safetyStatus,
    },
  };
}
