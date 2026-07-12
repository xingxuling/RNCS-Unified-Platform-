export interface ManifestLatentResult {
  manifestLayer: string[];
  latentLayer: string[];
  hiddenDrivers: string[];
  unexpressedPotential: string[];
  suppressedRisks: string[];
}

export function computeManifestLatent(input: { description: string }): ManifestLatentResult {
  const t = input.description || "";
  const grab = (re: RegExp) => (t.match(re) || []).map(s => s.trim()).slice(0, 4);
  const manifest = grab(/(?:展示|对外|公开|显示)[^。；\n]{0,30}/);
  const latent = grab(/(?:隐藏|潜在|未公开|内部)[^。；\n]{0,30}/);
  return {
    manifestLayer: manifest.length ? manifest : ["显层：可见的功能与外观表达"],
    latentLayer: latent.length ? latent : ["潜层：尚未表达的结构与意图"],
    hiddenDrivers: grab(/(?:其实想|真正想|底层想)[^。；\n]{0,30}/),
    unexpressedPotential: ["潜在能力待挖掘：可接入更高阶模块"],
    suppressedRisks: grab(/(?:压抑|忽略|未处理)[^。；\n]{0,30}/),
  };
}
