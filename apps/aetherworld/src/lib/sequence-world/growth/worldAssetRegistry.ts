export type WorldAssetType = "ZONE" | "NPC" | "QUEST" | "EVENT" | "RULE" | "RESOURCE" | "TIMELINE" | "CANON" | "NARRATIVE";

export interface WorldAsset {
  assetId: string;
  worldId: string;
  assetType: WorldAssetType;
  name: string;
  summary: string;
  valueScore: number;
  canonLevel: string;
  reusable: boolean;
  exportable: boolean;
  createdAt: string;
  nonRealAsset: true;
}

const KEY = "aether.world.growth.assets.v1";

export function loadAssets(worldId?: string): WorldAsset[] {
  try {
    const v = localStorage.getItem(KEY);
    const all: WorldAsset[] = v ? JSON.parse(v) : [];
    return worldId ? all.filter(a => a.worldId === worldId) : all;
  } catch { return []; }
}

function save(arr: WorldAsset[]) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(-1000))); } catch {}
}

export interface AssetValuationInput {
  canonLevel?: string;
  reusable?: boolean;
  hasCausalChain?: boolean;
  hasNarrativeUse?: boolean;
  safetyRisk?: boolean;
  duplicate?: boolean;
}

export function valuateAsset(input: AssetValuationInput): number {
  let score = 10;
  if (input.canonLevel === "FOUNDER_LOCKED") score += 30;
  else if (input.canonLevel === "HARD_CANON") score += 20;
  else if (input.canonLevel === "SOFT_CANON") score += 10;
  if (input.reusable) score += 8;
  if (input.hasCausalChain) score += 5;
  if (input.hasNarrativeUse) score += 5;
  if (input.safetyRisk) score -= 10;
  if (input.duplicate) score -= 8;
  return Math.max(0, score);
}

export function registerAsset(opts: Omit<WorldAsset, "assetId" | "createdAt" | "nonRealAsset" | "valueScore"> & { valueScore?: number; valuationInput?: AssetValuationInput }): WorldAsset {
  const valueScore = opts.valueScore ?? valuateAsset(opts.valuationInput ?? { canonLevel: opts.canonLevel, reusable: opts.reusable });
  const asset: WorldAsset = {
    assetId: `asset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    createdAt: new Date().toISOString(),
    nonRealAsset: true,
    valueScore,
    worldId: opts.worldId, assetType: opts.assetType, name: opts.name, summary: opts.summary,
    canonLevel: opts.canonLevel, reusable: opts.reusable, exportable: opts.exportable,
  };
  save([...loadAssets(), asset]);
  return asset;
}

export const ASSET_SAFETY_NOTE =
  "世界资产为虚拟世界结构与内部产品资产，不可交易、不可提现，不构成现实金融资产或投资标的。";
