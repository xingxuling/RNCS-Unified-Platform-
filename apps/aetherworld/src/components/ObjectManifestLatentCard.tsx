import type { ManifestLatentResult } from "@/lib/objectManifestLatentEngine";

export function ObjectManifestLatentCard({ ml }: { ml: ManifestLatentResult }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Manifest / Latent · 显层 与 潜层</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-muted-foreground mb-1">显层</div>
          <ul className="list-disc list-inside space-y-0.5">{ml.manifestLayer.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
        <div>
          <div className="text-muted-foreground mb-1">潜层</div>
          <ul className="list-disc list-inside space-y-0.5">{ml.latentLayer.map((s,i)=><li key={i}>{s}</li>)}</ul>
        </div>
      </div>
      {ml.hiddenDrivers.length > 0 && (
        <div className="text-xs"><span className="text-muted-foreground">隐藏驱动：</span>{ml.hiddenDrivers.join("；")}</div>
      )}
      {ml.suppressedRisks.length > 0 && (
        <div className="text-xs"><span className="text-muted-foreground">被压抑的风险：</span>{ml.suppressedRisks.join("；")}</div>
      )}
    </div>
  );
}
