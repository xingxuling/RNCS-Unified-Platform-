import type { AetherConcept, ConceptCompressionResult } from "./webLcmTypes";
import { newId } from "./webLcmTypes";
import { DEFAULT_WEB_LCM_COMPRESSION_PROFILE, WEB_LCM_COMPRESSION_PROFILES, type WebLcmCompressionProfile } from "@/constants/weblcm/webLcmCompressionProfiles";

export interface CompressOptions {
  profile?: WebLcmCompressionProfile;
  sourceObjectId?: string;
}

export function compressConcepts(concepts: AetherConcept[], opts: CompressOptions = {}): ConceptCompressionResult {
  const profileId = opts.profile ?? DEFAULT_WEB_LCM_COMPRESSION_PROFILE;
  const profile = WEB_LCM_COMPRESSION_PROFILES.find(p => p.id === profileId) ?? WEB_LCM_COMPRESSION_PROFILES[1];
  const sorted = [...concepts].sort((a, b) => b.confidence - a.confidence);
  const core = sorted.slice(0, profile.maxConcepts);
  const lost = sorted.slice(profile.maxConcepts).map(c => c.title);
  return {
    compressionId: newId("comp"),
    sourceObjectId: opts.sourceObjectId ?? "unknown",
    coreConcepts: core,
    compressionSummary: core.map(c => `• [${c.conceptType}] ${c.title}：${c.summary}`).join("\n"),
    lostDetails: lost,
    riskNotes: [
      "压缩后丢失的细节请勿等同删除。",
      "如需 WebLLM 展开，应附带 Safety Rules。",
    ],
  };
}
