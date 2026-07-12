import { Badge } from "@/components/ui/badge";
import { VERSION_STAGES } from "@/constants/versionStages";

export function VersionRoadmapBoard() {
  return (
    <div className="aether-card p-5 space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Version Roadmap · 版本路线图
        </div>
        <h3 className="font-display text-xl mt-1">从 v0.1 到 v2.0</h3>
        <p className="text-xs text-muted-foreground mt-1">
          每一版本代表一次结构性升级，而不是单一功能堆叠。
        </p>
      </div>

      <div className="relative pl-4">
        <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-3">
          {VERSION_STAGES.map((stage) => (
            <div key={stage.id} className="relative">
              <div
                className={`absolute -left-3 top-2 w-2 h-2 rounded-full ${
                  stage.shipped ? "bg-primary" : "bg-muted-foreground/40"
                }`}
              />
              <div className="aether-card p-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display text-base gold-text">{stage.label}</span>
                  <span className="text-sm">{stage.cn}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {stage.en}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      stage.shipped
                        ? "text-[10px] bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }
                  >
                    {stage.shipped ? "已完成" : "规划中"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{stage.summary}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {stage.pillars.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border/60 text-muted-foreground"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
