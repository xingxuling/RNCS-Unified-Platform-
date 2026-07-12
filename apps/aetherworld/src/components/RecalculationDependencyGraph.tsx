import { useMemo } from "react";
import { useAetherData } from "@/lib/useAetherData";
import { getSnapshot } from "@/lib/globalRecalculationEngine";
import { RECALC_MODULES, type RecalcModuleId } from "@/constants/recalculationScopes";

/**
 * 简易依赖图：以分层文本布局展示上下游关系。
 * 不引入额外图形库，保持深邃星图风。
 */
export function RecalculationDependencyGraph() {
  const { active, feedback } = useAetherData();
  const snap = useMemo(() => getSnapshot(), [active, feedback]);

  // 计算每个模块的"层级"：dependsOn 链最长长度
  const depth: Record<RecalcModuleId, number> = {} as never;
  function calc(id: RecalcModuleId): number {
    if (depth[id] !== undefined) return depth[id];
    const deps = RECALC_MODULES[id].dependsOn;
    depth[id] = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(calc));
    return depth[id];
  }
  (Object.keys(RECALC_MODULES) as RecalcModuleId[]).forEach(calc);

  const maxDepth = Math.max(...Object.values(depth));
  const layers: RecalcModuleId[][] = Array.from({ length: maxDepth + 1 }, () => []);
  (Object.keys(RECALC_MODULES) as RecalcModuleId[]).forEach((id) => {
    layers[depth[id]].push(id);
  });

  return (
    <div className="aether-card p-6 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Dependency Graph · 依赖图
        </div>
        <h2 className="font-display text-lg mt-0.5">上游变化将向下游传播</h2>
      </div>

      <div className="space-y-3">
        {layers.map((layer, i) => (
          <div key={i}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5">
              Layer {i} {i === 0 ? "· 数据源" : i === maxDepth ? "· 终端消费者" : ""}
            </div>
            <div className="flex flex-wrap gap-2">
              {layer.map((id) => {
                const m = RECALC_MODULES[id];
                const isStale = snap.modules[id].status === "stale";
                return (
                  <div
                    key={id}
                    className={`rounded-md border p-2 min-w-[140px] ${
                      isStale
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-border bg-secondary/10"
                    }`}
                  >
                    <div className="text-xs font-display">{m.cn}</div>
                    <div className="text-[10px] text-muted-foreground">{m.en}</div>
                    {m.dependsOn.length > 0 && (
                      <div className="text-[9px] text-muted-foreground mt-1 leading-tight">
                        ← {m.dependsOn.map((d) => RECALC_MODULES[d].cn).join(" / ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        箭头表示「依赖」：上游模块变化会让下游模块标记为过期，需要重算。
      </p>
    </div>
  );
}
