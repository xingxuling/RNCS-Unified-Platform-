// AetherSeed-VL 数据集版本管理（不上传，仅本地登记）
import type { VlmDatasetVersion, VlmSampleType } from "./vlmTypes";
import { getVlmSampleStats, listVlmSamples } from "./vlmSampleStore";

const VERSIONS: VlmDatasetVersion[] = [];
const listeners = new Set<() => void>();

export function subscribeVlmDatasetVersions(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listVlmDatasetVersions(): VlmDatasetVersion[] {
  return [...VERSIONS];
}

export function buildVlmDatasetVersion(label?: string): VlmDatasetVersion {
  const stats = getVlmSampleStats();
  const samples = listVlmSamples().filter((s) => s.safetyStatus !== "BLOCK");
  const perTypeCount = { ...stats.perType } as Record<VlmSampleType, number>;
  const version: VlmDatasetVersion = {
    id: `vlm_ds_${Date.now().toString(36)}`,
    name: label ?? `aetherseed-vl-private-dataset-v0.${VERSIONS.length + 1}`,
    createdAt: new Date().toISOString(),
    sampleCount: samples.length,
    imageCount: samples.reduce((a, s) => a + s.images.length, 0),
    perTypeCount,
    blockCount: stats.blockCount,
    averageQuality: stats.averageQuality,
    trainable: samples.length >= 1 && stats.blockCount < samples.length,
  };
  VERSIONS.unshift(version);
  for (const l of listeners) l();
  return version;
}
