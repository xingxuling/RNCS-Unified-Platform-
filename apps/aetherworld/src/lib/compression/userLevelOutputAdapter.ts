// 用户层级输出适配
import type { OutputAudienceId } from "@/constants/compression/outputAudienceTypes";
import type { CompressedOutput } from "./hybridCompressionEngine";

export function adaptForAudience(out: CompressedOutput, audience: OutputAudienceId): CompressedOutput {
  if (audience === "PLAIN_USER") {
    return {
      ...out,
      keySignals: undefined,
      visibleEvidence: undefined,
      founderTrace: undefined,
      hiddenTraceAvailable: false,
    };
  }
  if (audience === "STRUCTURED_USER" || audience === "CREATOR_USER") {
    return { ...out, founderTrace: undefined };
  }
  return out;
}
