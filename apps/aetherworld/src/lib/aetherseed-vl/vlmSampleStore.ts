// AetherSeed-VL 图文样本仓库（本地内存版，浏览器内 URL，不上传）
import type { MultimodalTrainingSample, VlmImage, VlmSampleType, VlmSafetyStatus } from "./vlmTypes";

const STORE: MultimodalTrainingSample[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeVlmSamples(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function listVlmSamples(): MultimodalTrainingSample[] {
  return [...STORE];
}

export interface CreateVlmSampleInput {
  sampleType: VlmSampleType;
  images: Array<Omit<VlmImage, "id" | "safetyStatus"> & { safetyStatus?: VlmSafetyStatus }>;
  instruction: string;
  answer: string;
  tags?: string[];
  licenseStatus?: string;
  safetyStatus?: VlmSafetyStatus;
  qualityScore?: number;
  sourceRunId?: string;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function scoreQuality(s: CreateVlmSampleInput): number {
  let score = 50;
  if (s.instruction.length > 12) score += 10;
  if (s.answer.length > 30) score += 15;
  if (s.answer.length > 120) score += 10;
  if (s.images.length >= 1) score += 10;
  if (s.tags && s.tags.length > 0) score += 5;
  return Math.min(100, score);
}

export function createVlmSample(input: CreateVlmSampleInput): MultimodalTrainingSample {
  const safetyStatus: VlmSafetyStatus =
    input.safetyStatus ?? (input.images.some((i) => i.safetyStatus === "BLOCK") ? "BLOCK" : "PASS");
  const sample: MultimodalTrainingSample = {
    id: uid("vlm"),
    sourceRunId: input.sourceRunId ?? uid("run"),
    sampleType: input.sampleType,
    images: input.images.map((img) => ({
      ...img,
      id: uid("img"),
      safetyStatus: img.safetyStatus ?? "PASS",
    })),
    instruction: input.instruction.trim(),
    answer: input.answer.trim(),
    tags: input.tags ?? [],
    targetModel: "AETHERSEED_VL_PRIVATE",
    licenseStatus: input.licenseStatus ?? "FOUNDER_OWNED",
    safetyStatus,
    qualityScore: input.qualityScore ?? scoreQuality(input),
    createdAt: new Date().toISOString(),
  };
  STORE.push(sample);
  emit();
  return sample;
}

export function deleteVlmSample(id: string) {
  const idx = STORE.findIndex((s) => s.id === id);
  if (idx >= 0) {
    STORE.splice(idx, 1);
    emit();
  }
}

export function clearVlmSamples() {
  STORE.length = 0;
  emit();
}

export function getVlmSampleStats() {
  const samples = STORE;
  const perType = {
    IMAGE_TEXT_PAIR: 0,
    IMAGE_INSTRUCTION_PAIR: 0,
    UI_SCREENSHOT_QA: 0,
    CHARACTER_IMAGE_QA: 0,
    SYMBOL_IMAGE_QA: 0,
    DIAGRAM_IMAGE_QA: 0,
    MULTI_IMAGE_QA: 0,
    IMAGE_CAPTION: 0,
    IMAGE_REASONING_SAMPLE: 0,
  } as Record<VlmSampleType, number>;
  let imageCount = 0;
  let blockCount = 0;
  let qualitySum = 0;
  for (const s of samples) {
    perType[s.sampleType] += 1;
    imageCount += s.images.length;
    if (s.safetyStatus === "BLOCK") blockCount += 1;
    qualitySum += s.qualityScore;
  }
  return {
    sampleCount: samples.length,
    imageCount,
    perType,
    blockCount,
    averageQuality: samples.length ? Math.round(qualitySum / samples.length) : 0,
  };
}
