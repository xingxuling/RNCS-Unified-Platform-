// 联网 → 开源架构吸收 桥接：把 NetworkSource 转成 OpenArchitectureSource 并触发分析
import type { NetworkSource } from "./aetherNetworkTypes";

export async function forwardToOpenArchitecture(src: NetworkSource) {
  try {
    const { createSource, absorbOpenArchitecture } = await import("@/lib/open-architecture/openArchitectureRuntime");
    const oaSourceType =
      src.sourceType === "GITHUB_REPO" ? "GITHUB_REPO" :
      src.sourceType === "GITHUB_README" ? "README" : "MANUAL_DESCRIPTION";
    const oaSource = createSource({
      title: src.title ?? src.url,
      url: src.url,
      rawText: src.extractedText,
      sourceType: oaSourceType as "GITHUB_REPO" | "README" | "MANUAL_DESCRIPTION",
    });
    const result = absorbOpenArchitecture(oaSource);
    src.relatedAnalysisId = result.analysis.id;
    return result;
  } catch (e) {
    return { error: (e as Error).message };
  }
}
