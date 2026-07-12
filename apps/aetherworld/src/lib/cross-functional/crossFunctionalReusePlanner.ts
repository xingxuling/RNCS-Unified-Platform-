import type { CrossFunctionalOutput, ReusableAsset } from "./crossFunctionalOutputAdapter";

export interface ReusePlan {
  assetId: string;
  recommendedEngines: string[];
  note: string;
}

export function planAssetReuse(output: CrossFunctionalOutput): ReusePlan[] {
  return output.reusableAssets.map((a) => ({
    assetId: a.assetId,
    recommendedEngines: a.reusableIn,
    note: `「${a.title}」可继续投入：${a.reusableIn.join(" / ")}`,
  }));
}
