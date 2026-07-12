import { useState } from "react";
import { runMissingLayerDetection, type MissingLayerDetectionResult } from "@/lib/missing-layer/missingLayerDetectionCalculus";
import { SystemCapabilityMap } from "./SystemCapabilityMap";
import { SystemLayerMap } from "./SystemLayerMap";
import { MissingLayerCard } from "./MissingLayerCard";
import { UpgradeRecommendationPanel } from "./UpgradeRecommendationPanel";
import { ReusePotentialPanel } from "./ReusePotentialPanel";
import { FragmentationRiskPanel } from "./FragmentationRiskPanel";
import { RuntimeGapPanel } from "./RuntimeGapPanel";
import { ObjectLayerGapPanel } from "./ObjectLayerGapPanel";
import { GovernanceGapPanel } from "./GovernanceGapPanel";
import { UserUnderstandingGapPanel } from "./UserUnderstandingGapPanel";
import { CommercialPresentationGapPanel } from "./CommercialPresentationGapPanel";
import { MissingLayerQaPanel } from "./MissingLayerQaPanel";
import { MissingLayerSafetyNote } from "./MissingLayerSafetyNote";

export function MissingLayerPanel() {
  const [result, setResult] = useState<MissingLayerDetectionResult>(() => runMissingLayerDetection());

  const rerun = () => setResult(runMissingLayerDetection());

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `missing-layer-${result.scanId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <MissingLayerSafetyNote />

      <div className="aether-card p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <Stat label="总能力" value={result.systemCapabilityMap.totalCapabilities} />
          <Stat label="缺层数" value={result.missingLayers.length} />
          <Stat label="碎片化" value={result.fragmentationResult.fragmentationScore} />
          <Stat label="Runtime 缺口" value={result.runtimeGapResult.runtimeGapScore} />
          <Stat label="对象缺口" value={result.objectLayerGapResult.objectGapScore} />
          <Stat label="跨域桥缺口" value={result.crossFunctionalGapResult.bridgeGapScore} />
          <Stat label="治理缺口" value={result.governanceGapResult.governanceGapScore} />
          <Stat label="用户理解" value={result.userUnderstandingGapResult.understandingGapScore} />
          <Stat label="商业展示" value={result.commercialPresentationGapResult.presentationGapScore} />
          <Stat label="过度生长" value={result.overgrowthRiskResult.overgrowthScore} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={rerun} className="text-xs px-3 py-1.5 rounded border border-primary/60 bg-primary/10 hover:bg-primary/20 text-primary">Run Scan</button>
          <button onClick={exportJson} className="text-xs px-3 py-1.5 rounded border border-border/60 hover:bg-background/40">Export Recommendation</button>
        </div>
      </div>

      <UpgradeRecommendationPanel recs={result.recommendations} />

      <SystemCapabilityMap map={result.systemCapabilityMap} />
      <SystemLayerMap map={result.systemLayerMap} />

      <div className="aether-card p-4 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">缺层列表 · Missing Layers</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-auto">
          {result.missingLayers.map(i => (<MissingLayerCard key={i.issueId} issue={i} />))}
          {result.missingLayers.length === 0 && <div className="text-xs text-muted-foreground">未检测到明显缺层</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ReusePotentialPanel score={result.reusePotential} />
        <FragmentationRiskPanel r={result.fragmentationResult} />
        <RuntimeGapPanel r={result.runtimeGapResult} />
        <ObjectLayerGapPanel r={result.objectLayerGapResult} />
        <GovernanceGapPanel r={result.governanceGapResult} />
        <UserUnderstandingGapPanel r={result.userUnderstandingGapResult} />
        <CommercialPresentationGapPanel r={result.commercialPresentationGapResult} />
        <MissingLayerQaPanel result={result} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-background/30 border border-border/40 rounded p-2">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-lg font-display">{value}</div>
    </div>
  );
}
