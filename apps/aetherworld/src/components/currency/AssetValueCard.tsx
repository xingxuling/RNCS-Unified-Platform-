import { useState } from "react";
import { ASSET_TYPES, type AssetTypeId } from "@/constants/currency/assetTypes";
import { valueAsset } from "@/lib/currency/sequenceCurrencyEngine";
import type { AssetValueResult } from "@/lib/currency/assetValuationEngine";

export function AssetValueCard() {
  const [assetType, setAssetType] = useState<AssetTypeId>("MODEL_ASSET");
  const [assetId, setAssetId] = useState("asset-001");
  const [completeness, setCompleteness] = useState(7);
  const [reusability, setReusability] = useState(6);
  const [userBenefit, setUserBenefit] = useState(7);
  const [validationDepth, setValidationDepth] = useState(5);
  const [safetyScore, setSafetyScore] = useState(8);
  const [result, setResult] = useState<AssetValueResult | null>(null);

  function run() {
    setResult(valueAsset({
      assetId, assetType,
      completeness, reusability, userBenefit, validationDepth, safetyScore,
      uniqueness: 6, complexity: 6, exportability: 6, relatedModules: 2, isTemplate: false,
    }));
  }

  return (
    <div className="border rounded-md p-4 space-y-3 bg-card">
      <div>
        <h3 className="text-sm font-medium">资产估值 · Asset Valuation</h3>
        <p className="text-[11px] text-muted-foreground">输出为内部价值评分，不代表现实金额。</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span>资产类型</span>
          <select value={assetType} onChange={(e) => setAssetType(e.target.value as AssetTypeId)} className="w-full border rounded px-2 py-1 bg-background">
            {ASSET_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span>资产 ID</span>
          <input value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full border rounded px-2 py-1 bg-background" />
        </label>
        {[
          ["完整度", completeness, setCompleteness],
          ["可复用性", reusability, setReusability],
          ["用户收益", userBenefit, setUserBenefit],
          ["回验深度", validationDepth, setValidationDepth],
          ["安全分", safetyScore, setSafetyScore],
        ].map(([label, val, set]) => (
          <label key={label as string} className="space-y-1">
            <span>{label as string}：{val as number}</span>
            <input type="range" min={0} max={10} value={val as number} onChange={(e) => (set as (n: number) => void)(parseInt(e.target.value, 10))} className="w-full" />
          </label>
        ))}
      </div>
      <button onClick={run} className="text-xs px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200">估值</button>
      {result && (
        <div className="border-t pt-3 text-xs space-y-1">
          <div>内部价值分：<span className="font-semibold text-amber-400">{result.internalValueScore}/100</span></div>
          <div>建议积分：<span className="font-mono">{result.suggestedCredits}</span></div>
          <div>复用潜力：{result.reusePotential}</div>
          {result.valueFactors.length > 0 && <div className="text-emerald-400">优势：{result.valueFactors.join(" · ")}</div>}
          {result.riskFactors.length > 0 && <div className="text-red-400">风险：{result.riskFactors.join(" · ")}</div>}
        </div>
      )}
    </div>
  );
}
