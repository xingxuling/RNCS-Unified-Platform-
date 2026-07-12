import type { CrossFunctionalVariableMap } from "@/lib/cross-functional/crossFunctionalVariableMapper";
import { TRANSFORMATION_LABELS } from "@/constants/cross-functional/crossFunctionalVariableTypes";
import { ENGINE_LABELS } from "@/constants/cross-functional/crossFunctionalEnginePairs";

export function CrossFunctionalVariableMap({ maps }: { maps: CrossFunctionalVariableMap[] }) {
  if (!maps.length) return null;
  return (
    <div className="space-y-3">
      {maps.map((m) => (
        <div key={m.mapId} className="aether-card p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">变量映射</div>
          <div className="text-sm">
            {m.sourceObjectType} → <span className="text-primary">{ENGINE_LABELS[m.targetEngine] ?? m.targetEngine}</span>
          </div>
          {m.transferableVariables.length === 0 && (
            <div className="text-xs text-muted-foreground">暂无预置映射，可手动指定。</div>
          )}
          <ul className="space-y-1">
            {m.transferableVariables.map((v) => (
              <li key={v.variableName} className="text-xs">
                <span className="text-foreground">{v.variableName}</span>
                <span className="text-muted-foreground"> · {v.sourceMeaning} → {v.targetMeaning}</span>
                <span className="ml-2 text-[10px] rounded border px-1 py-0.5 text-muted-foreground">
                  {TRANSFORMATION_LABELS[v.transformationType]}
                </span>
                {v.requiredAdaptation && <span className="text-[11px] text-muted-foreground"> · {v.requiredAdaptation}</span>}
              </li>
            ))}
          </ul>
          {m.blockedVariables.length > 0 && (
            <div className="text-[11px] text-muted-foreground">
              不可迁移：{m.blockedVariables.map((b) => b.variableName).join("、")}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
