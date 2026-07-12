import type { CrossFunctionalOutput } from "@/lib/cross-functional/crossFunctionalOutputAdapter";
import { OUTPUT_LABELS } from "@/constants/cross-functional/crossFunctionalOutputProfiles";

export function CrossFunctionalOutputPreview({
  output,
  onSave,
}: { output: CrossFunctionalOutput; onSave?: () => void }) {
  return (
    <div className="aether-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">跨功能输出</div>
          <div className="font-display text-lg gold-text">{output.title}</div>
          <div className="text-[10px] text-muted-foreground">{OUTPUT_LABELS[output.outputType]}</div>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            className="text-xs rounded border border-primary/50 text-primary px-3 py-1.5 hover:bg-primary/10 transition"
          >
            保存到 Workspace
          </button>
        )}
      </div>
      <p className="text-sm text-foreground/85">{output.summary}</p>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">各引擎输出</div>
        <ul className="space-y-1">
          {output.engineOutputs.map((e) => (
            <li key={e.engineId} className="text-xs">
              <span className="text-foreground">{e.engineId}</span>
              <span className="text-muted-foreground"> · {e.outputSummary}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">可复用资产</div>
        <div className="flex flex-wrap gap-2">
          {output.reusableAssets.map((a) => (
            <span key={a.assetId} className="text-[11px] rounded border border-border/60 px-2 py-1">
              {a.title}
            </span>
          ))}
        </div>
      </div>

      <div className="text-[11px] text-muted-foreground">
        下一步推荐引擎：{output.nextPossibleEngines.join("、")}
      </div>
    </div>
  );
}
