import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
  MODULE_STABILITY_META,
  MODULE_STABILITY_REGISTRY,
  type ModuleStabilityLevel,
} from "@/constants/moduleStabilityLevels";

const ORDER: ModuleStabilityLevel[] = [
  "STABLE",
  "BETA",
  "EXPERIMENTAL",
  "PLACEHOLDER",
  "LOCKED",
];

export function ModuleStabilityMatrix() {
  return (
    <div className="aether-card p-5 space-y-5">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Module Stability Matrix
        </div>
        <h3 className="font-display text-xl mt-1">模块稳定矩阵</h3>
        <p className="text-xs text-muted-foreground mt-1">
          标记每个模块的稳定等级，决定其在 v1.0 内测中的开放方式。
        </p>
      </div>

      <div className="space-y-4">
        {ORDER.map((lvl) => {
          const meta = MODULE_STABILITY_META[lvl];
          const items = MODULE_STABILITY_REGISTRY.filter((m) => m.level === lvl);
          if (items.length === 0) return null;
          return (
            <div key={lvl} className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${meta.badgeClass}`}>
                  {meta.cn} · {meta.en}
                </Badge>
                <span className="text-[11px] text-muted-foreground">{meta.desc}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((item) => {
                  const inner = (
                    <div className="aether-card p-3 hover:border-primary/40 transition-colors">
                      <div className="text-sm">{item.cn}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                        {item.en}
                      </div>
                    </div>
                  );
                  return item.route ? (
                    <Link key={item.id} to={item.route} className="block">
                      {inner}
                    </Link>
                  ) : (
                    <div key={item.id}>{inner}</div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
